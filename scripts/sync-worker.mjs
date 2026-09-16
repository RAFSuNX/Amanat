// Long-running ledger sync worker.
//
// Fires an incremental sync on every ledger write (Postgres LISTEN/NOTIFY, sent by
// the set_updated_at trigger), debounced so a burst collapses into one pass; also
// runs a full reconcile hourly as a safety net. syncOnce() itself holds a
// cross-process advisory lock, so multiple workers are safe; the in-process
// running/queued flags coalesce overlapping local triggers.

import postgres from "postgres"
import { syncOnce } from "./sync-ledger-core.mjs"

let running = false
let queued = false

async function runSync(reason) {
  if (running) {
    queued = true // a pass is in flight; make sure we run once more after it
    return
  }
  running = true
  try {
    do {
      queued = false
      try {
        const r = await syncOnce()
        if (r && !r.skipped) console.log(`[sync] (${reason})`, JSON.stringify(r.summary))
      } catch (e) {
        console.error(`[sync] pass failed (${reason}):`, e.message)
      }
    } while (queued)
  } finally {
    running = false
  }
}

let debounce = null
function scheduleSync() {
  if (debounce) return
  debounce = setTimeout(() => {
    debounce = null
    runSync("notify")
  }, 1500)
}

async function main() {
  const primaryUrl = process.env.DATABASE_URL
  if (!primaryUrl) throw new Error("DATABASE_URL not set")

  const listener = postgres(primaryUrl, { max: 1, prepare: false, idle_timeout: 0 })
  await listener.listen("ledger_sync", () => scheduleSync())
  console.log("[sync] worker up; listening on ledger_sync")

  await runSync("startup") // initial catch-up / provisioning check

  const hourly = setInterval(() => runSync("hourly"), 60 * 60 * 1000)

  const shutdown = async () => {
    clearInterval(hourly)
    try { await listener.end({ timeout: 5 }) } catch { /* ignore */ }
    process.exit(0)
  }
  process.on("SIGTERM", shutdown)
  process.on("SIGINT", shutdown)
}

main().catch((e) => {
  console.error("[sync] fatal:", e)
  process.exit(1)
})
