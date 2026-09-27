#!/bin/bash
# Local dev environment — safe values only, no production credentials.
# Shell exports override .env.local (Next.js priority: process env > .env files).

set -e

# ── Infrastructure ────────────────────────────────────────────────────────────
echo "[dev] Starting local infrastructure..."
docker compose up postgres postgres-audit redis -d --wait 2>/dev/null || \
  docker-compose up postgres postgres-audit redis -d 2>/dev/null || true
sleep 2

# ── Safe local env (overrides .env.local) ─────────────────────────────────────
export DATABASE_URL="postgresql://amanat:amanat_dev@localhost:5432/amanat"
export AUDIT_DATABASE_URL="postgresql://amanat_audit:amanat_audit_dev@localhost:5433/amanat_audit"
export REDIS_URL="redis://localhost:6379"
export POSTGRES_PASSWORD="amanat_dev"
export AUDIT_DB_PASSWORD="amanat_audit_dev"

export BETTER_AUTH_URL="http://localhost:3000"
export BETTER_AUTH_SECRET="dev-secret-change-this-for-real-use-amanat-local"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

# R2 — fake values; file uploads will fail gracefully in dev
export R2_ENDPOINT="https://dev-placeholder.r2.cloudflarestorage.com"
export R2_ACCESS_KEY_ID="dev"
export R2_SECRET_ACCESS_KEY="dev-secret"
export R2_BUCKET_NAME="dev-bucket"
export R2_KYC_BUCKET_NAME="dev-kyc-bucket"
export R2_PUBLIC_URL="http://localhost:3000/dev-files"

# Email — fake key passes format check (re_*), but won't actually send
export RESEND_API_KEY="re_dev_fake_key_local_only_not_real"
export RESEND_FROM_EMAIL="dev@localhost"
export SUPPORT_EMAIL="dev@localhost"

# Skip R2/Neon/Supabase connectivity checks at startup
export DEV_SKIP_CONNECTIVITY="1"

# Remote replicas — point at local DB so preflight passes without hitting Supabase/Neon
export BACKUP_DATABASE_URL="postgresql://amanat:amanat_dev@localhost:5432/amanat"
export REMOTE_PUBLIC_LEDGER_DATABASE_URL="postgresql://amanat:amanat_dev@localhost:5432/amanat"
export NEON_DATABASE_URL="postgresql://amanat:amanat_dev@localhost:5432/amanat"

# ── Migrations + seed ────────────────────────────────────────────────────────
echo "[dev] Running migrations..."
npm run db:migrate 2>/dev/null || true
npm run db:audit:migrate 2>/dev/null || true
echo "[dev] Seeding mock data..."
node scripts/seed-dev.mjs

# ── Dev server ────────────────────────────────────────────────────────────────
echo "[dev] http://localhost:3000"
npm run dev
