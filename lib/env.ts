// Startup environment validation.
//
// Two layers:
//   1. validateEnv()      - every key is present AND its value is real
//                           (not a placeholder). Sync, fails fast.
//   2. checkConnectivity() - the thing each var points at is actually reachable
//                           (DB accepts a query, Redis answers PING, R2 bucket
//                           responds). Async. This is the difference between
//                           "DATABASE_URL is set" and "the database is up".

import postgres from "postgres"
import Redis from "ioredis"
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3"

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "AUDIT_DATABASE_URL",
  "REDIS_URL",
  "BACKUP_DATABASE_URL",
  "REMOTE_PUBLIC_LEDGER_DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const

function die(title: string, problems: string[]): never {
  console.error("\n================================================================")
  console.error(`  STARTUP FAILED - ${title}`)
  console.error("================================================================")
  problems.forEach((p) => console.error(`  x  ${p}`))
  console.error("================================================================\n")
  process.exit(1)
}

// ── Layer 1: presence + value sanity ──────────────────────────────────────────
export function validateEnv() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]?.trim())
  if (missing.length > 0) die("Missing required environment variables", missing)

  const bad: string[] = []

  // A secret must be a real secret, not the example/default placeholder.
  const secret = process.env.BETTER_AUTH_SECRET!
  if (secret.length < 32 || /^(change|changeme|secret|default|xxxx)/i.test(secret))
    bad.push("BETTER_AUTH_SECRET looks like a placeholder or is too short (need a real 32+ char secret)")

  if (!isUrl(process.env.BETTER_AUTH_URL!)) bad.push("BETTER_AUTH_URL is not a valid URL")
  if (!isUrl(process.env.R2_ENDPOINT!)) bad.push("R2_ENDPOINT is not a valid URL")
  if (!isUrl(process.env.R2_PUBLIC_URL!)) bad.push("R2_PUBLIC_URL is not a valid URL")

  for (const key of ["DATABASE_URL", "AUDIT_DATABASE_URL", "BACKUP_DATABASE_URL", "REMOTE_PUBLIC_LEDGER_DATABASE_URL"] as const)
    if (!/^postgres(ql)?:\/\//.test(process.env[key]!)) bad.push(`${key} is not a postgres:// connection string`)

  if (!process.env.RESEND_API_KEY!.startsWith("re_"))
    bad.push("RESEND_API_KEY does not look like a Resend key (expected re_...)")
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(process.env.RESEND_FROM_EMAIL!))
    bad.push("RESEND_FROM_EMAIL is not a valid email address")

  if (bad.length > 0) die("Environment values are set but invalid", bad)
}

// ── Layer 2: the dependencies are actually reachable ──────────────────────────
export async function checkConnectivity() {
  const failures: string[] = []
  const warnings: string[] = []

  // Databases the app serves from - hard requirement.
  for (const [key, label] of [
    ["DATABASE_URL", "main database"],
    ["AUDIT_DATABASE_URL", "audit database"],
  ] as const) {
    const err = await pingPostgres(process.env[key]!)
    if (err) failures.push(`${label} (${key}) unreachable: ${err}`)
    else console.log(`  ok  ${label} reachable`)
  }

  // Redis - hard requirement.
  {
    const err = await pingRedis(process.env.REDIS_URL!)
    if (err) failures.push(`Redis (REDIS_URL) unreachable: ${err}`)
    else console.log("  ok  redis reachable")
  }

  // R2 bucket - hard requirement (uploads break without it).
  {
    const err = await pingR2()
    if (err) failures.push(`R2 bucket (R2_*) unreachable: ${err}`)
    else console.log("  ok  R2 bucket reachable")
  }

  // Backup / replica DBs - the app never serves from these, so unreachable is a
  // warning, not a boot blocker (the backup image is what truly depends on them).
  for (const [key, label] of [
    ["BACKUP_DATABASE_URL", "backup database"],
    ["REMOTE_PUBLIC_LEDGER_DATABASE_URL", "public-ledger replica"],
  ] as const) {
    const err = await pingPostgres(process.env[key]!)
    if (err) warnings.push(`${label} (${key}) unreachable: ${err}`)
    else console.log(`  ok  ${label} reachable`)
  }

  warnings.forEach((w) => console.warn(`  !   ${w}`))
  if (failures.length > 0) die("Required dependencies are not reachable", failures)
  console.log("  ok  all required dependencies reachable\n")
}

function isUrl(v: string) {
  try { const u = new URL(v); return u.protocol === "http:" || u.protocol === "https:" } catch { return false }
}

async function pingPostgres(url: string): Promise<string | null> {
  let sql: ReturnType<typeof postgres> | undefined
  try {
    sql = postgres(url, { max: 1, connect_timeout: 10, idle_timeout: 1, onnotice: () => {} })
    await sql`select 1`
    return null
  } catch (e) {
    return (e as Error).message
  } finally {
    await sql?.end({ timeout: 5 }).catch(() => {})
  }
}

async function pingRedis(url: string): Promise<string | null> {
  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  })
  try {
    await client.connect()
    await client.ping()
    return null
  } catch (e) {
    return (e as Error).message
  } finally {
    client.disconnect()
  }
}

async function pingR2(): Promise<string | null> {
  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestHandler: { requestTimeout: 8000 } as never,
  })
  try {
    await client.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME! }))
    return null
  } catch (e) {
    return (e as Error).message
  } finally {
    client.destroy()
  }
}
