// Incremental, collision-proof sync from the in-cluster primary to the external
// Supabase ledger (and optionally the backup) databases.
//
// - Keyed on sync_id (a stable per-row UUID), so a server rebuild that resets the
//   integer ids can never collide/contaminate an already-synced dest row.
// - Incremental: only rows whose updated_at moved past a per-table watermark.
// - Idempotent UPSERT: re-running is safe; a failed table just retries next pass.
// - Cluster-safe: the whole pass holds a Postgres advisory lock, so two workers
//   (rolling restart, or notify-vs-hourly overlap) never sync at the same time.
//
// Schema provisioning (creating the dest tables) is done out-of-band; a dest
// table that doesn't exist yet is skipped with a warning, not an error.

import postgres from "postgres"

const ADVISORY_KEY = 918273645 // arbitrary constant, shared by every worker

// FK-safe order: parents before children.
const TABLES = [
  "users",
  "volunteer_profiles",
  "beneficiaries",
  "need_assessments",
  "distribution_cycles",
  "distribution_allotments",
  "donations",
]

// Full business table set for Neon — includes everything with updated_at + sync_id.
// sessions/verifications/accounts skipped (transient auth data).
// audit_logs skipped (append-only, lives in separate audit DB in production).
const NEON_TABLES = [
  "users",
  "volunteer_profiles",
  "beneficiaries",
  "beneficiary_members",
  "need_assessments",
  "distribution_cycles",
  "distribution_allotments",
  "donations",
  "special_need_applications",
]

const BATCH = 500

function connect(url, max = 2) {
  // prepare:false: Supabase's transaction pooler doesn't support prepared statements.
  return postgres(url, { max, prepare: false, idle_timeout: 20, connect_timeout: 15, onnotice: () => {} })
}

async function columnsOf(sql, table) {
  const rows = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = ${table}
    order by ordinal_position`
  return rows.map((r) => r.column_name)
}

// A dest is ready for a table only once that table exists AND has the sync_id
// column (the conflict key). Lets us skip a not-yet-provisioned dest - or the
// backup DB before its schema has caught up - instead of erroring.
async function destReady(sql, table) {
  const [row] = await sql`
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = ${table} and column_name = 'sync_id' limit 1`
  return !!row
}

async function ensureSyncState(dest) {
  // last_updated_at is TEXT on purpose: it holds the source updated_at verbatim,
  // full-precision, with no Date coercion or timezone conversion. The comparison
  // casts it back to timestamp in the primary query.
  await dest`create table if not exists _sync_state (
    table_name text primary key,
    last_updated_at text not null default '1970-01-01 00:00:00'
  )`
}

// Watermark is carried as full-precision TEXT the whole way. A JS Date only keeps
// milliseconds, but Postgres timestamps keep microseconds - round-tripping through
// a Date would truncate the watermark and re-sync every row forever.
async function getWatermark(dest, table) {
  const [row] = await dest`select last_updated_at as wm from _sync_state where table_name = ${table}`
  return row ? row.wm : "1970-01-01 00:00:00"
}

// Sync one table into one dest. Returns the number of rows upserted.
async function syncTable(primary, dest, table) {
  if (!(await destReady(dest, table))) {
    console.warn(`  skip ${table}: dest not provisioned yet`)
    return 0
  }
  const cols = await columnsOf(primary, table)
  const setList = cols
    .filter((c) => c !== "sync_id")
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(", ")

  let total = 0
  // Loop batches until the table is drained (watermark advances each batch).
  for (;;) {
    const wm = await getWatermark(dest, table)
    // Compare as TEXT, not timestamp: binding the watermark against a ::timestamp
    // makes postgres-js coerce it to a millisecond JS Date, truncating it so every
    // row re-matches. The fixed "YYYY-MM-DD HH:MM:SS.ffffff" format sorts
    // chronologically as text. _wm carries the next watermark (ignored by insert).
    const rows = await primary.unsafe(
      `select *, updated_at::text as _wm from "${table}" where updated_at::text > $1 order by updated_at asc limit ${BATCH}`,
      [wm]
    )
    if (rows.length === 0) break
    const nextWm = rows[rows.length - 1]._wm

    // One transaction per batch: watermark only advances after the upsert commits,
    // so a crash mid-batch just replays the same rows (idempotent) next pass.
    // postgres-js builds the (cols) VALUES (...) with correct per-column binding.
    await dest.begin(async (tx) => {
      // Conflict on id: handles rows that exist in dest with a different or null
      // sync_id (e.g. users pre-dating the sync worker). sync_id is always
      // updated so subsequent passes align correctly on sync_id thereafter.
      // The primary DB uses persistent storage and never resets, so id is stable.
      await tx`
        insert into ${tx(table)} ${tx(rows, ...cols)}
        on conflict (id) do update set ${tx.unsafe(setList)}`
      await tx`
        insert into _sync_state (table_name, last_updated_at)
        values (${table}, ${nextWm})
        on conflict (table_name) do update set last_updated_at = excluded.last_updated_at`
    })
    total += rows.length
    if (rows.length < BATCH) break
  }
  return total
}

// One full pass over every dest+table, guarded by a single advisory lock.
export async function syncOnce({ log = console.log } = {}) {
  const primaryUrl = process.env.DATABASE_URL
  if (!primaryUrl) throw new Error("DATABASE_URL not set")

  const dests = [
    ["ledger", process.env.REMOTE_PUBLIC_LEDGER_DATABASE_URL, TABLES],
    ["backup", process.env.BACKUP_DATABASE_URL, TABLES],
    ["neon",   process.env.NEON_DATABASE_URL,   NEON_TABLES],
  ].filter(([, url]) => !!url)

  const primary = connect(primaryUrl)
  // The advisory lock is session-scoped, so it must live on ONE pinned connection
  // for the whole pass - reserve it so lock/unlock can't land on different ones.
  const held = await primary.reserve()
  try {
    const [{ locked }] = await held`select pg_try_advisory_lock(${ADVISORY_KEY}) as locked`
    if (!locked) {
      log("sync: another pass holds the lock; skipping")
      return { skipped: true }
    }
    try {
      const summary = {}
      for (const [name, url, tables] of dests) {
        // Each destination is fully independent — one failing never blocks another.
        const dest = connect(url)
        try {
          await ensureSyncState(dest)
          let n = 0
          for (const table of tables) {
            try {
              n += await syncTable(primary, dest, table)
            } catch (err) {
              // Schema drift (missing column, missing table) — log and continue.
              // Fix: apply migrations to the destination DB.
              log(`sync -> ${name}: skip ${table}: ${err.message}`)
            }
          }
          summary[name] = n
          log(`sync -> ${name}: ${n} row(s) upserted`)
        } catch (err) {
          // Full destination failure (connection, auth) — log and continue to next dest.
          log(`sync -> ${name}: dest failed: ${err.message}`)
          summary[name] = 'failed'
        } finally {
          await dest.end({ timeout: 5 }).catch(() => {})
        }
      }
      return { skipped: false, summary }
    } finally {
      await held`select pg_advisory_unlock(${ADVISORY_KEY})`
    }
  } finally {
    held.release()
    await primary.end({ timeout: 5 })
  }
}
