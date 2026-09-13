#!/bin/sh
# Sets up PostgreSQL logical replication from local DB to the remote public ledger DB.
# Run ONCE after initial deployment. Re-running is safe (uses IF NOT EXISTS).
#
# Usage:
#   DATABASE_URL=... REMOTE_PUBLIC_LEDGER_DATABASE_URL=... ./scripts/setup-replication.sh

set -e

LOCAL="${DATABASE_URL}"
REMOTE="${REMOTE_PUBLIC_LEDGER_DATABASE_URL}"

if [ -z "$LOCAL" ] || [ -z "$REMOTE" ]; then
  echo "ERROR: DATABASE_URL and REMOTE_PUBLIC_LEDGER_DATABASE_URL must be set"
  exit 1
fi

echo "[replication] Setting up publication on local database..."

# Tables that form the public ledger
psql "$LOCAL" <<'SQL'
  -- Publication for all public ledger tables
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'amanat_public_ledger') THEN
      CREATE PUBLICATION amanat_public_ledger FOR TABLE
        donations,
        distribution_cycles,
        distribution_allotments,
        beneficiaries,
        need_assessments,
        users,
        volunteer_profiles;
      RAISE NOTICE 'Publication created.';
    ELSE
      RAISE NOTICE 'Publication already exists.';
    END IF;
  END $$;
SQL

echo "[replication] Creating subscription on remote database..."

# The remote DB must already have the schema.
# Run: REMOTE_PUBLIC_LEDGER_DATABASE_URL=... npx drizzle-kit push --config drizzle.remote.config.ts
# before running this script.

psql "$REMOTE" <<SQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_subscription WHERE subname = 'amanat_sub') THEN
      CREATE SUBSCRIPTION amanat_sub
        CONNECTION '${LOCAL}'
        PUBLICATION amanat_public_ledger
        WITH (copy_data = true);
      RAISE NOTICE 'Subscription created and initial data sync started.';
    ELSE
      RAISE NOTICE 'Subscription already exists.';
    END IF;
  END \$\$;
SQL

echo "[replication] Done. Remote database will now stay in sync in real time."
echo ""
echo "Verify with:"
echo "  psql \$LOCAL -c \"SELECT * FROM pg_replication_slots;\""
echo "  psql \$REMOTE -c \"SELECT * FROM pg_stat_subscription;\""
