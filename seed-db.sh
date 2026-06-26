#!/bin/bash
# Seed the AcquirerLite database
set -e

CONTAINER_NAME="acquirer-mssql"
SA_PASSWORD="Workshop!Pass123"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_FILE="$SCRIPT_DIR/../db/seed.sql"

SQLCMD="/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $SA_PASSWORD -C"

echo "Seeding AcquirerLite database..."

# Step 1: Drop and create database (must run against master)
container exec "$CONTAINER_NAME" $SQLCMD -Q "
IF DB_ID('AcquirerLite') IS NOT NULL
BEGIN
    ALTER DATABASE AcquirerLite SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE AcquirerLite;
END;
CREATE DATABASE AcquirerLite;
" > /dev/null 2>&1

echo "  Database created"

# Step 2: Extract everything after 'USE AcquirerLite' and remove GO lines
# Then execute as one batch against AcquirerLite
SCHEMA_AND_DATA=$(sed -n '/^USE AcquirerLite/,$ p' "$SEED_FILE" | grep -v "^USE " | grep -v "^GO" | grep -v "^$")

container exec "$CONTAINER_NAME" $SQLCMD -d AcquirerLite -Q "$SCHEMA_AND_DATA" > /dev/null 2>&1

echo "  Schema and data loaded"

# Step 3: Verify
COUNTS=$(container exec "$CONTAINER_NAME" $SQLCMD -d AcquirerLite -h -1 -Q "
SELECT 'Merchants: ' + CAST(COUNT(*) AS VARCHAR) FROM Merchants
UNION ALL SELECT 'Terminals: ' + CAST(COUNT(*) AS VARCHAR) FROM Terminals
UNION ALL SELECT 'Transactions: ' + CAST(COUNT(*) AS VARCHAR) FROM Transactions
UNION ALL SELECT 'Batches: ' + CAST(COUNT(*) AS VARCHAR) FROM SettlementBatches
" 2>&1)

echo "$COUNTS" | grep -v "^$" | while read line; do echo "  $line"; done

# Verify batch 1 is Open (critical for workshop)
STATUS=$(container exec "$CONTAINER_NAME" $SQLCMD -d AcquirerLite -h -1 -Q "
SELECT Status FROM SettlementBatches WHERE Id=1
" 2>&1 | head -1 | tr -d ' ')

if [ "$STATUS" = "Open" ]; then
  echo "✓ Database seeded successfully (Batch 1 is Open — ready for workshop)"
else
  echo "⚠ Seed completed but Batch 1 status is '$STATUS' (expected 'Open')"
  exit 1
fi
