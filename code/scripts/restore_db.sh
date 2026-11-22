#!/bin/bash
# Restore PostgreSQL Database for Deutschly
set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore_db.sh <path_to_backup.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE does not exist!"
    exit 1
fi

echo "Restoring database from: $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i deutschly_postgres psql -U "${POSTGRES_USER:-deutschly_user}" -d "${POSTGRES_DB:-deutschly}"

echo "Database restoration completed successfully!"
