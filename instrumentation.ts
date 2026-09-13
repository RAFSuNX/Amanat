// Runs once at server startup (not during build).
// Safe to call process.exit here — it only fires when the server actually boots.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv, checkConnectivity } = await import("./lib/env")
    validateEnv()            // keys present + values real (not placeholders)
    await checkConnectivity() // DB/Redis/R2 actually reachable
  }
}
