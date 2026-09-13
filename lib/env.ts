// Startup environment validation.
// ALL keys must be present. Missing any = hard crash with a clear message.

const REQUIRED_KEYS = [
  // Core
  "DATABASE_URL",
  "AUDIT_DATABASE_URL",
  "REDIS_URL",
  // Auth
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  // Remote databases (Supabase)
  "BACKUP_DATABASE_URL",
  "REMOTE_PUBLIC_LEDGER_DATABASE_URL",
  // File storage (Cloudflare R2)
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
  // Email
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
] as const

export function validateEnv() {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error("\n")
    console.error("================================================================")
    console.error("  STARTUP FAILED — Missing required environment variables:")
    console.error("================================================================")
    missing.forEach((key) => console.error(`  x  ${key}`))
    console.error("")
    console.error("  Copy .env.example to .env.local and fill in all values.")
    console.error("================================================================\n")
    process.exit(1)
  }
}
