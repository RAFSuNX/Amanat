#!/bin/sh
# Run drizzle-kit migrate against a remote DB with retries.
# Usage: migrate-remote.sh <NAME> <DATABASE_URL>
# Exits 0 on success, 1 after all retries exhausted.
set -e

NAME="$1"
URL="$2"
MAX=3
WAIT=10

if [ -z "$URL" ]; then
  echo "[migrate-remote] $NAME: URL not set, skipping"
  exit 0
fi

i=1
while [ $i -le $MAX ]; do
  echo "[migrate-remote] $NAME: attempt $i/$MAX..."
  if DATABASE_URL="$URL" npm run db:migrate --silent; then
    echo "[migrate-remote] $NAME: done"
    exit 0
  fi
  echo "[migrate-remote] $NAME: attempt $i failed"
  i=$((i + 1))
  [ $i -le $MAX ] && sleep $WAIT
done

echo "[migrate-remote] $NAME: all $MAX attempts failed — deploy blocked"
exit 1
