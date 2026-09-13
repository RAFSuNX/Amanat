import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Single fork so DB integration tests never run concurrently against the
    // same schema.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
})
