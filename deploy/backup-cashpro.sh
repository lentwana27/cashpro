#!/bin/bash
# Daily backup of the cashpro MySQL database only. Independent of any ERP backup routine.
set -euo pipefail

BACKUP_DIR="/root/db-backups/cashpro"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/cashpro_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
mysqldump --single-transaction --quick --routines --triggers cashpro | gzip > "$FILE"

# Prune backups older than retention period
find "$BACKUP_DIR" -name 'cashpro_*.sql.gz' -mtime +$RETENTION_DAYS -delete

echo "$(date -Is) backup OK: $FILE ($(du -h "$FILE" | cut -f1))"
