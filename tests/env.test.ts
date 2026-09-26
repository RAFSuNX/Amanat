import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { validateEnv } from "@/lib/env"

const VALID: Record<string, string> = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUDIT_DATABASE_URL: "postgresql://u:p@localhost:5432/audit",
  REDIS_URL: "redis://localhost:6379",
  BACKUP_DATABASE_URL: "postgresql://u:p@host:5432/backup",
  REMOTE_PUBLIC_LEDGER_DATABASE_URL: "postgresql://u:p@host:5432/remote",
  NEON_DATABASE_URL: "postgresql://u:p@host:5432/neon",
  BETTER_AUTH_SECRET: "x7f".padEnd(40, "k"), // 40 chars, not a placeholder word
  BETTER_AUTH_URL: "https://amanat.example.com",
  R2_ENDPOINT: "https://acc.r2.cloudflarestorage.com",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_NAME: "amanat-files",
  R2_KYC_BUCKET_NAME: "amanat-kyc",
  R2_PUBLIC_URL: "https://files.amanat.example.com",
  RESEND_API_KEY: "re_abc123",
  RESEND_FROM_EMAIL: "no-reply@amanat.example.com",
}

let saved: NodeJS.ProcessEnv

beforeEach(() => {
  saved = process.env
  process.env = { ...VALID } as NodeJS.ProcessEnv
  // validateEnv exits the process on failure; make that throwable so we can assert.
  vi.spyOn(process, "exit").mockImplementation(((): never => { throw new Error("EXIT") }) as never)
  vi.spyOn(console, "error").mockImplementation(() => {})
})
afterEach(() => {
  process.env = saved
  vi.restoreAllMocks()
})

describe("validateEnv", () => {
  it("passes with a fully valid, real environment", () => {
    expect(() => validateEnv()).not.toThrow()
  })

  it("fails when a required key is missing", () => {
    delete process.env.DATABASE_URL
    expect(() => validateEnv()).toThrow("EXIT")
  })

  it("rejects a placeholder auth secret", () => {
    process.env.BETTER_AUTH_SECRET = "CHANGE_ME_change_me_change_me_change"
    expect(() => validateEnv()).toThrow("EXIT")
  })

  it("rejects a too-short auth secret", () => {
    process.env.BETTER_AUTH_SECRET = "short"
    expect(() => validateEnv()).toThrow("EXIT")
  })

  it("rejects a non-URL auth URL", () => {
    process.env.BETTER_AUTH_URL = "amanat.example.com"
    expect(() => validateEnv()).toThrow("EXIT")
  })

  it("rejects a non-postgres database URL", () => {
    process.env.DATABASE_URL = "mysql://u:p@localhost/db"
    expect(() => validateEnv()).toThrow("EXIT")
  })

  it("rejects a Resend key that is not re_...", () => {
    process.env.RESEND_API_KEY = "sk_live_nope"
    expect(() => validateEnv()).toThrow("EXIT")
  })

  it("rejects an invalid from-email", () => {
    process.env.RESEND_FROM_EMAIL = "not-an-email"
    expect(() => validateEnv()).toThrow("EXIT")
  })
})
