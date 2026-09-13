// Startup environment validation.
// ALL keys must be present. Missing any = hard crash with a clear message.

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "AUDIT_DATABASE_URL",
  "REDIS_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
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
