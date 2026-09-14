// Migrate-image startup checker.
// Verifies the databases are actually reachable (accept a query) BEFORE
// drizzle-kit runs - so a bad/unreachable DB fails fast with a clear message
// instead of the migrator hanging on "applying migrations".
import postgres from "postgres"

const targets = [
  ["DATABASE_URL", "main database"],
  ["AUDIT_DATABASE_URL", "audit database"],
]

let failed = false
for (const [key, label] of targets) {
  const url = process.env[key]
  if (!url) {
    console.error(`  x  ${key} is not set`)
    failed = true
    continue
  }
  let sql
  try {
    sql = postgres(url, { max: 1, connect_timeout: 10, idle_timeout: 1, onnotice: () => {} })
    await sql`select 1`
    console.log(`  ok  ${label} reachable`)
  } catch (e) {
    console.error(`  x  ${label} (${key}) unreachable: ${e.message}`)
    failed = true
  } finally {
    await sql?.end({ timeout: 5 }).catch(() => {})
  }
}

if (failed) {
  console.error("preflight failed - not running migrations")
  process.exit(1)
}
console.log("preflight ok - running migrations")
