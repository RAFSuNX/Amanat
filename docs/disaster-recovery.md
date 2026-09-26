# Disaster Recovery Plan

**Last updated:** 2026-09-26
**System:** Amanat — theamanat.org

---

## Where Everything Lives

| Asset | Location |
|---|---|
| App code | `github.com/RAFSuNX/Amanat` |
| k8s manifests | `github.com/RAFSuNX/server-hub` |
| All secrets | Doppler → `amanat` / `prd` |
| Container images | `ghcr.io/rafsunx/amanat:main` |
| Live DB backup (real-time) | Neon (`NEON_DATABASE_URL` in Doppler) |
| Daily snapshot backup | Supabase (`BACKUP_DATABASE_URL` in Doppler) |
| Public ledger replica | Supabase (`REMOTE_PUBLIC_LEDGER_DATABASE_URL` in Doppler) |
| Local file backup | `/home/rafsunx/r2-backup/` |
| R2 public files | `amanat-files` bucket, `BACKUP_DATABASE_URL` in Doppler |
| R2 private KYC docs | `amanat-kyc` bucket (private), accessed via server proxy |

---

## Scenario 1 — Pod Crash (auto-recovers)

**What:** App pod or sync worker crashes.
**Action:** Nothing — k8s restarts it automatically. Readiness probe gates traffic until healthy.
**Verify:**

```bash
kubectl get pods -n amanat
```

All pods `Running`. Check `theamanat.org` loads.

---

## Scenario 2 — Postgres-0 Data Loss

PVC corrupted, node lost, or data wiped.

**Step 1 — Stop writes** (prevent further corruption):

```bash
kubectl scale deployment amanat -n amanat --replicas=0
kubectl scale deployment amanat-sync -n amanat --replicas=1
```

**Which remote to use — decision order:**

1. **Neon** (`NEON_DATABASE_URL`) — preferred. Real-time push-sync means seconds of lag. Covers all 9 business tables.
2. **Supabase backup** (`BACKUP_DATABASE_URL`) — fallback. Daily pg_dump, max 24h old. Full schema including auth tables.
3. **Supabase ledger** (`REMOTE_PUBLIC_LEDGER_DATABASE_URL`) — last resort. Only 7 ledger tables, missing auth/sessions/etc.

**Step 2a — Restore from Neon** (fastest, preferred):

```bash
# Get connection string from Doppler
NEON_DATABASE_URL=$(doppler secrets get NEON_DATABASE_URL --project amanat --config prd --plain)

pg_dump "$NEON_DATABASE_URL" \
  --no-owner --no-privileges \
  -f neon_dump.sql

psql "$DATABASE_URL" < neon_dump.sql
```

**Step 2b — Or restore from Supabase daily backup** (max 24h old, fallback):

```bash
BACKUP_DATABASE_URL=$(doppler secrets get BACKUP_DATABASE_URL --project amanat --config prd --plain)

pg_dump "$BACKUP_DATABASE_URL" \
  --no-owner --no-privileges \
  -f backup_dump.sql

psql "$DATABASE_URL" < backup_dump.sql
```

**Step 3 — Apply migrations** to ensure schema is current:

```bash
kubectl delete job db-migrate -n amanat --ignore-not-found
kubectl apply -f server-hub/k8s/amanat/05-migration-job.yaml
# Wait for Completed status
kubectl wait --for=condition=complete job/db-migrate -n amanat --timeout=120s
```

**Step 4 — Restore traffic:**

```bash
kubectl scale deployment amanat -n amanat --replicas=2
```

**Step 5 — Verify** (see checklist at bottom).

---

## Scenario 3 — Full Cluster Loss

Entire k3s node gone. Rebuild from scratch.

**Step 1 — Provision a new node** (VPS or bare metal).

**Step 2 — Install prerequisites:**

- k3s
- Flux
- External Secrets Operator (for Doppler)
- Cloudflare Tunnel agent (`cloudflared`)

**Step 3 — Bootstrap Doppler secret** (all other secrets auto-populate):

```bash
kubectl create secret generic doppler-amanat-token \
  --from-literal=dopplerToken=<DOPPLER_SERVICE_TOKEN> -n default
```

Doppler syncs all secrets to the cluster within minutes via the ExternalSecret.

**Step 4 — Point Flux at server-hub repo** — Flux reconciles and deploys all manifests automatically. Container images pull from GHCR.

**Step 5 — Restore databases:**

- Postgres-0 starts empty after PVC recreation — restore from Neon or Supabase (Scenario 2, Steps 2–3).
- Audit DB starts empty — restore from Supabase backup (`audit` schema):

```bash
pg_dump $BACKUP_DATABASE_URL --schema=audit > audit_dump.sql
psql $AUDIT_DATABASE_URL < audit_dump.sql
```

**Step 6 — Restore R2 files** (only if buckets were wiped):

```bash
# Files are backed up locally at /home/rafsunx/r2-backup/
# Re-upload using the upload script with new R2 credentials
```

Then update `volunteer_profiles.passport_photo_url` and `kyc_doc_image_url` in the DB if bucket paths changed.

**Step 7 — Reconnect Cloudflare Tunnel** → DNS for `theamanat.org` auto-updates.

**Step 8 — Verify** (see checklist at bottom).

---

## Scenario 4 — R2 Bucket Loss

Files wiped — KYC documents, avatars, donation receipts.

**Restore from local backup:**

```bash
# Backup is at /home/rafsunx/r2-backup/
# Directory structure mirrors the R2 key paths
# Re-upload using the same script used during bucket migration
```

**Update DB** if bucket names or key paths changed:

```sql
UPDATE volunteer_profiles
SET passport_photo_url = REPLACE(passport_photo_url, 'old-url', 'new-url');
```

**Impact during outage:** KYC review page shows broken/missing images. No financial data affected.

---

## Scenario 5 — Neon or Supabase Goes Down

**Action:** Nothing — these are replicas, not the source of truth.

- Public ledger (`/ledger`) stops updating → acceptable degraded state, data still visible
- Neon unavailable → no data loss, sync worker retries automatically on recovery
- Supabase backup unavailable → primary DB and Neon still intact

Sync worker retries every pass (LISTEN/NOTIFY + hourly fallback). All missed writes are replayed automatically when the destination recovers — no manual action needed.

---

## Scenario 6 — Resend (Email) Goes Down

**Impact:** No confirmation emails, no password reset emails, no KYC verification emails.

**Workaround:** Email verification is skipped if `RESEND_API_KEY` is not set. Users can still register and use the app — they just won't receive transactional emails.

**Recovery:** Resend outages are self-resolving. No data loss. Emails for actions during the outage are not resent retroactively.

---

## How to Verify All Databases Are In Sync

Run this to compare record counts across all four databases:

```bash
node --input-type=module <<'EOF'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const postgres = require('postgres')

const TABLES = ['users','volunteer_profiles','beneficiaries','donations',
  'distribution_cycles','distribution_allotments','need_assessments']

const dbs = {
  local:   process.env.DATABASE_URL,
  neon:    process.env.NEON_DATABASE_URL,
  ledger:  process.env.REMOTE_PUBLIC_LEDGER_DATABASE_URL,
  backup:  process.env.BACKUP_DATABASE_URL,
}

for (const table of TABLES) {
  const counts = {}
  for (const [name, url] of Object.entries(dbs)) {
    if (!url) continue
    const db = postgres(url, { max: 1, prepare: false })
    const [{ count }] = await db`SELECT COUNT(*) FROM ${db(table)}`
    counts[name] = count
    await db.end()
  }
  const values = Object.values(counts)
  const synced = values.every(v => v === values[0]) ? 'OK' : 'DRIFT'
  console.log(`${synced.padEnd(6)} ${table}: ${JSON.stringify(counts)}`)
}
EOF
```

**Expected:** All counts match for each table. Any mismatch means sync lag or a failed pass — check sync worker logs and wait for the next NOTIFY or hourly pass.

**Check sync worker status:**

```bash
kubectl logs -n amanat deploy/amanat-sync --tail=30
# Look for: "sync -> neon: N row(s) upserted"
# No "pass failed" errors
```

**Force an immediate sync pass** (without waiting for a write to trigger NOTIFY):

```bash
kubectl rollout restart deployment/amanat-sync -n amanat
# Restart triggers a startup sync pass against all destinations
```

**Check watermarks** (how far behind each destination is):

```bash
# On local postgres
kubectl exec -n amanat postgres-0 -- psql -U amanat -d amanat -c \
  "SELECT tablename, MAX(updated_at) as latest FROM (
     SELECT 'donations' as tablename, updated_at FROM donations
     UNION ALL SELECT 'users', updated_at FROM users
   ) t GROUP BY tablename;"

# Compare with Neon
psql $NEON_DATABASE_URL -c \
  "SELECT 'donations' as t, MAX(updated_at) FROM donations
   UNION ALL SELECT 'users', MAX(updated_at) FROM users;"
```

---

## Verification Checklist

Run after any recovery scenario:

```bash
# 1. Health endpoint
curl https://theamanat.org/api/health
# Expected: 200 OK

# 2. Public ledger readable
curl -s https://theamanat.org/ledger/donations | grep -c "AMT-"
# Expected: number > 0

# 3. Sync worker healthy
kubectl logs -n amanat deploy/amanat-sync --tail=10
# Expected: "sync -> ledger: N row(s) upserted" and "sync -> neon: N row(s) upserted"

# 4. Neon has live data
psql $NEON_DATABASE_URL -c "SELECT COUNT(*) FROM donations;"
# Expected: matches local postgres-0 count

# 5. Audit log intact
kubectl exec -n amanat postgres-audit-0 -- \
  psql -U amanat_audit -d amanat_audit -c "SELECT COUNT(*) FROM audit_logs;"
# Expected: non-zero

# 6. Admin login
# Navigate to theamanat.org/login → sign in as admin → /admin dashboard loads

# 7. Money conservation
kubectl exec -n amanat postgres-0 -- psql -U amanat -d amanat -c "
  SELECT
    SUM(amount) FILTER (WHERE status='CONFIRMED') as total_in,
    (SELECT SUM(da.allocated_amount) FROM distribution_allotments da
     JOIN distribution_cycles dc ON da.cycle_id = dc.id
     WHERE dc.status='COMPLETED') as total_out
  FROM donations;"
# Verify total_in >= total_out (money conservation holds)
```

---

## Maximum Data Loss Estimates

| Scenario | Max data loss |
|---|---|
| Pod crash | 0 (in-flight requests roll back) |
| Postgres-0 loss, Neon healthy | Seconds (Neon lag) |
| Postgres-0 loss, Neon also lost | Up to 24 hours (daily Supabase backup) |
| Full cluster loss | Same as above |
| R2 bucket loss | Files only — no financial data |

---

## Emergency Contacts

- Doppler service tokens: stored in team 1Password / secure location
- NEON_REPLICATOR_PASSWORD: Doppler `amanat/prd`
- Cloudflare account: Cloudflare dashboard under RAFSuNX org
- GitHub: `github.com/RAFSuNX`
