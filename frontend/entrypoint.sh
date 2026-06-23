#!/bin/sh
set -e

echo "Fetching content from database..."
node scripts/fetch-content.mjs

echo "Building frontend..."
NODE_OPTIONS=--max-old-space-size=4096 pnpm build

echo "Copying dist to nginx volume..."
cp -r dist/* /dist/

echo "Frontend build complete."
