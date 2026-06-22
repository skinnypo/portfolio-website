#!/bin/sh
set -e

echo "Fetching content from database..."
node scripts/fetch-content.mjs

echo "Building frontend..."
pnpm build

echo "Copying dist to nginx volume..."
cp -r dist/* /dist/

echo "Frontend build complete."
