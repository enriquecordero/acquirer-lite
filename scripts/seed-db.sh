#!/bin/bash
# Seed the AcquirerLite database
set -e

CONTAINER_NAME="acquirer-mssql"
SA_PASSWORD="Workshop!Pass123"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_FILE="$SCRIPT_DIR/../db/seed.sql"

echo "Seeding AcquirerLite database..."

# Copy seed file into container and execute
cat "$SEED_FILE" | container exec "$CONTAINER_NAME" /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C -i /dev/stdin

echo "✓ Database seeded successfully"
