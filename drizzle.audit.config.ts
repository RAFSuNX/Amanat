import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./db/audit-schema.ts",
  out: "./db/audit-migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.AUDIT_DATABASE_URL!,
  },
})
