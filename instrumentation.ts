// Runs once at server startup (not during build).
// Safe to call process.exit here - it only fires when the server actually boots.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv, checkConnectivity } = await import("./lib/env")
    validateEnv()
    // Skip connectivity checks in dev (R2/Neon/Supabase not needed locally)
    if (process.env.DEV_SKIP_CONNECTIVITY !== "1") {
      await checkConnectivity()
    }
  }
}
