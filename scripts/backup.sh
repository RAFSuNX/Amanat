#!/bin/sh
set -e

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_PREFIX="[backup ${TIMESTAMP}]"

echo "${LOG_PREFIX} Starting database backup to Supabase"

# ── Production database → Supabase backup DB ──────────────────────────────
PROD_FILE="/tmp/amanat_prod_${TIMESTAMP}.dump"

echo "${LOG_PREFIX} Dumping production database..."
pg_dump "${DATABASE_URL}" > "${PROD_FILE}"

echo "${LOG_PREFIX} Restoring to Supabase backup DB..."
psql "${BACKUP_DATABASE_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null || true
psql "${BACKUP_DATABASE_URL}" < "${PROD_FILE}"
rm -f "${PROD_FILE}"
echo "${LOG_PREFIX} Production DB backed up to Supabase."

# ── Audit database → Supabase backup DB (separate schema) ─────────────────
AUDIT_FILE="/tmp/amanat_audit_${TIMESTAMP}.dump"

echo "${LOG_PREFIX} Dumping audit database..."
pg_dump "${AUDIT_DATABASE_URL}" > "${AUDIT_FILE}"

echo "${LOG_PREFIX} Restoring audit DB to Supabase backup DB (audit schema)..."
psql "${BACKUP_DATABASE_URL}" -c "DROP SCHEMA IF EXISTS audit CASCADE; CREATE SCHEMA audit;" 2>/dev/null || true
psql "${BACKUP_DATABASE_URL}" --no-psqlrc -c "SET search_path TO audit;" < "${AUDIT_FILE}" 2>/dev/null || \
  pg_restore --schema=audit -d "${BACKUP_DATABASE_URL}" "${AUDIT_FILE}" 2>/dev/null || true
rm -f "${AUDIT_FILE}"
echo "${LOG_PREFIX} Audit DB backed up to Supabase."

echo "${LOG_PREFIX} Backup complete"
