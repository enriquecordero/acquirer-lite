#!/bin/bash
# Start SQL Server using macOS native container runtime
set -e

CONTAINER_NAME="acquirer-mssql"
SA_PASSWORD="Workshop!Pass123"
IMAGE="mcr.microsoft.com/mssql/server:2022-latest"

# Check if container already exists
if container inspect "$CONTAINER_NAME" > /dev/null 2>&1; then
  STATE=$(container inspect "$CONTAINER_NAME" --format '{{.State}}' 2>/dev/null || echo "unknown")
  if [ "$STATE" = "running" ]; then
    echo "✓ $CONTAINER_NAME is already running"
  else
    echo "Starting existing container $CONTAINER_NAME..."
    container start "$CONTAINER_NAME"
  fi
else
  echo "Creating $CONTAINER_NAME..."
  container run \
    --name "$CONTAINER_NAME" \
    -d \
    -p 1433:1433 \
    -m 3072M \
    --arch amd64 \
    --rosetta \
    -e ACCEPT_EULA=Y \
    -e "MSSQL_SA_PASSWORD=$SA_PASSWORD" \
    "$IMAGE"
fi

echo "Waiting for SQL Server to be ready..."
for i in $(seq 1 30); do
  if container exec "$CONTAINER_NAME" /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
    echo "✓ SQL Server is ready on port 1433"
    exit 0
  fi
  sleep 2
done

echo "⚠ SQL Server did not start in time. Check: container logs $CONTAINER_NAME"
exit 1
