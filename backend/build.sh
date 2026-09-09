#!/bin/bash
set -e
echo "==> Generating Prisma client..."
npx prisma generate
echo "==> Running migrations..."
npx prisma migrate deploy
echo "==> Compiling TypeScript..."
npx tsc
echo "==> Build complete!"
