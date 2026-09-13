#!/bin/sh
# Backup-image startup checker.
# Verifies every database the backup depends on is actually reachable (accepts a
# query), not just that the env var is set. Runs at container start and before
# each scheduled backup.
set -e

check() { # $1=url  $2=label  $3=key
  if [ -z "$1" ]; then echo "  x  $3 is not set"; exit 1; fi
  if psql "$1" -tAc "select 1" >/dev/null 2>&1; then
    echo "  ok  $2 reachable"
  else
    echo "  x  $2 ($3) unreachable"; exit 1
  fi
}

check "${DATABASE_URL}" "source database" "DATABASE_URL"
check "${AUDIT_DATABASE_URL}" "audit database" "AUDIT_DATABASE_URL"
check "${BACKUP_DATABASE_URL}" "backup destination" "BACKUP_DATABASE_URL"
echo "  ok  backup preflight passed"
