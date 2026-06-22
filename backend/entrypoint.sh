#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
RETRIES=30
until pg_isready -h "${POSTGRES_HOST:-postgres}" -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "PostgreSQL not ready, retrying... ($RETRIES attempts left)"
  sleep 1
done

if [ $RETRIES -eq 0 ]; then
  echo "ERROR: PostgreSQL did not become ready in time."
  exit 1
fi

echo "Running migrations..."
pnpm exec prisma migrate deploy || { echo "ERROR: Migration failed."; exit 1; }

echo "Seeding database (first run only)..."
node dist/seed.js || { echo "ERROR: Seed failed."; exit 1; }

echo "Starting server..."
exec node dist/index.js
