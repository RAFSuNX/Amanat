// Runs once at server startup (not during build).
// Safe to call process.exit here — it only fires when the server actually boots.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("./lib/env")
    validateEnv()
  }
}
