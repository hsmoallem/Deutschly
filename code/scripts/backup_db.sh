#!/bin/bash
# Backup PostgreSQL Database for Deutschly
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/deutschly_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup: ${BACKUP_FILE}..."
docker exec -t deutschly_postgres pg_dump -U "${POSTGRES_USER:-deutschly_user}" "${POSTGRES_DB:-deutschly}" | gzip > "$BACKUP_FILE"

echo "Backup created successfully! Size: $(du -h "$BACKUP_FILE" | cut -f1)"
# Keep last 14 backups
find "$BACKUP_DIR" -type f -name "deutschly_backup_*.sql.gz" -mtime +14 -exec rm {} \;
echo "Pruning older backups completed."
