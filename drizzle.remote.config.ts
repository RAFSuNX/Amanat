// Used to push the schema to the remote public ledger database before setting up replication.
// Run: REMOTE_PUBLIC_LEDGER_DATABASE_URL=... npx drizzle-kit push --config drizzle.remote.config.ts

import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/remote-migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.REMOTE_PUBLIC_LEDGER_DATABASE_URL!,
  },
})
