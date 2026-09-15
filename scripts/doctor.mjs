// Preflight "doctor" for the repo itself - runs first in CI, before tests/build.
// Catches structural problems that would otherwise blow up much later (e.g. the
// missing migration journal that made the migrate job hang).
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { execSync } from "node:child_process"

const problems = []
const ok = (m) => console.log(`  ok  ${m}`)
const fail = (m) => { problems.push(m); console.error(`  x   ${m}`) }

// 1. Node version (image targets node 20+).
const major = Number(process.versions.node.split(".")[0])
if (major >= 20) ok(`node ${process.versions.node}`)
else fail(`node ${process.versions.node} - need >= 20`)

// 2 + 3. Migration sets are complete and consistent: every .sql has a journal
// entry and the journal has no dangling tags. A missing meta/ is the failure
// that shipped a broken migrate image.
function checkMigrations(dir) {
  const journalPath = `${dir}/meta/_journal.json`
  if (!existsSync(journalPath)) return fail(`${journalPath} missing (drizzle needs it to apply migrations)`)
  const journal = JSON.parse(readFileSync(journalPath, "utf8"))
  const tags = new Set(journal.entries.map((e) => e.tag))
  const sqls = readdirSync(dir).filter((f) => f.endsWith(".sql")).map((f) => f.replace(/\.sql$/, ""))
  for (const sql of sqls)
    if (!tags.has(sql)) fail(`${dir}/${sql}.sql has no journal entry`)
  for (const tag of tags)
    if (!sqls.includes(tag)) fail(`${dir}/meta journal references missing ${tag}.sql`)
  if (sqls.length > 0 && problems.length === 0) ok(`${dir}: ${sqls.length} migration(s), journal consistent`)
  else if (sqls.length > 0) ok(`${dir}: ${sqls.length} migration(s) present`)
}
checkMigrations("db/migrations")
checkMigrations("db/audit-migrations")

// 4. .dockerignore blocks .env so secrets can't be baked into an image.
if (existsSync(".dockerignore") && /^\.env(\.\*|\*)?$/m.test(readFileSync(".dockerignore", "utf8")))
  ok(".dockerignore blocks .env")
else fail(".dockerignore missing or does not exclude .env")

// 5. No real .env is tracked in git (only .env.example is allowed).
try {
  const tracked = execSync("git ls-files .env .env.*", { encoding: "utf8" })
    .split("\n").map((s) => s.trim()).filter(Boolean).filter((f) => f !== ".env.example")
  if (tracked.length === 0) ok("no secret .env files tracked in git")
  else fail(`secret env file(s) tracked in git: ${tracked.join(", ")}`)
} catch { ok("git not available - skipped .env tracking check") }

// 6. Required npm scripts exist.
const pkg = JSON.parse(readFileSync("package.json", "utf8"))
for (const s of ["build", "test", "typecheck", "db:migrate", "db:audit:migrate"]) {
  if (pkg.scripts?.[s]) ok(`script "${s}" present`)
  else fail(`package.json script "${s}" missing`)
}

// 7. Drizzle configs exist.
for (const f of ["drizzle.config.ts", "drizzle.audit.config.ts"]) {
  if (existsSync(f)) ok(`${f} present`)
  else fail(`${f} missing`)
}

if (problems.length > 0) {
  console.error(`\ndoctor failed with ${problems.length} problem(s)\n`)
  process.exit(1)
}
console.log("\ndoctor: all checks passed\n")
