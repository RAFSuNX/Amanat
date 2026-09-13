#!/bin/sh
set -e

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DATE=$(date +%Y-%m-%d)
LOG_PREFIX="[backup ${TIMESTAMP}]"

echo "${LOG_PREFIX} Starting database backup"

# Configure AWS CLI for R2
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"
S3_ENDPOINT="${R2_ENDPOINT}"
BUCKET="${R2_BUCKET_NAME}"

upload() {
  local file="$1"
  local key="$2"
  aws s3 cp "${file}" "s3://${BUCKET}/${key}" \
    --endpoint-url "${S3_ENDPOINT}" \
    --no-progress
  echo "${LOG_PREFIX} Uploaded: ${key}"
}

# ── Production database backup ─────────────────────────────────────────────
PROD_FILE="/tmp/amanat_prod_${TIMESTAMP}.dump.gz"
echo "${LOG_PREFIX} Dumping production database..."
pg_dump "${DATABASE_URL}" | gzip > "${PROD_FILE}"
upload "${PROD_FILE}" "backups/postgres/production/${DATE}/${TIMESTAMP}.dump.gz"
rm -f "${PROD_FILE}"

# ── Audit database backup ──────────────────────────────────────────────────
AUDIT_FILE="/tmp/amanat_audit_${TIMESTAMP}.dump.gz"
echo "${LOG_PREFIX} Dumping audit database..."
pg_dump "${AUDIT_DATABASE_URL}" | gzip > "${AUDIT_FILE}"
upload "${AUDIT_FILE}" "backups/postgres/audit/${DATE}/${TIMESTAMP}.dump.gz"
rm -f "${AUDIT_FILE}"

# ── Prune backups older than 30 days ──────────────────────────────────────
echo "${LOG_PREFIX} Pruning backups older than 30 days..."
CUTOFF=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d)

for PREFIX in "backups/postgres/production" "backups/postgres/audit"; do
  aws s3 ls "s3://${BUCKET}/${PREFIX}/" --endpoint-url "${S3_ENDPOINT}" | \
  awk '{print $2}' | tr -d '/' | while read FOLDER; do
    if [ "${FOLDER}" \< "${CUTOFF}" ]; then
      aws s3 rm "s3://${BUCKET}/${PREFIX}/${FOLDER}/" \
        --endpoint-url "${S3_ENDPOINT}" --recursive --quiet
      echo "${LOG_PREFIX} Pruned: ${PREFIX}/${FOLDER}"
    fi
  done
done

echo "${LOG_PREFIX} Backup complete"
