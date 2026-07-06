#!/bin/sh
set -e

# Strapi gets its own database on the same Postgres instance/superuser as the
# backend's Prisma-managed database — separate schema, no shared tables.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE strapi OWNER "$POSTGRES_USER"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'strapi')\gexec
EOSQL
