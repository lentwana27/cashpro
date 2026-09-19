#!/bin/bash
# Monthly restore drill: proves the latest cashpro backup actually restores
# and matches live row counts. Uses a scratch DB, never touches live data.
# Emails ALERT_TO on any failure - fill in the real recipient before installing.
set -uo pipefail

BACKUP_DIR="/root/db-backups/cashpro"
TEST_DB="cashpro_restore_drill"
LOG="/var/log/cashpro-restore-drill.log"
ALERT_TO="ALERT_RECIPIENT_EMAIL"
TABLES="branches exchange_rate_history exchange_rates messages reconciliations system_logs system_updates users"

log() { echo "$(date -Is) $1" | tee -a "$LOG"; }

alert_fail() {
  local subject="$1"
  {
    echo "To: $ALERT_TO"
    echo "From: ALERT_FROM_EMAIL"
    echo "Subject: $subject"
    echo ""
    echo "CashPro monthly restore drill failed on $(hostname) at $(date -Is)."
    echo ""
    echo "$2"
    echo ""
    echo "Full log: $LOG"
  } | msmtp "$ALERT_TO" 2>>"$LOG" || log "WARNING: failed to send alert email"
}

cleanup() {
  mysql -e "DROP DATABASE IF EXISTS $TEST_DB;" 2>/dev/null
}
trap cleanup EXIT

log "=== restore drill starting ==="

LATEST=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST" ]; then
  log "FAIL: no backup file found in $BACKUP_DIR"
  alert_fail "[CashPro] Restore drill FAILED: no backup found" "No .sql.gz backup file was found in $BACKUP_DIR."
  exit 1
fi
log "using backup: $LATEST"

if ! gzip -t "$LATEST" 2>>"$LOG"; then
  log "FAIL: gzip integrity check failed for $LATEST"
  alert_fail "[CashPro] Restore drill FAILED: corrupt backup" "gzip integrity check failed for $LATEST."
  exit 1
fi
log "gzip integrity OK"

mysql -e "DROP DATABASE IF EXISTS $TEST_DB; CREATE DATABASE $TEST_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ! zcat "$LATEST" | mysql "$TEST_DB" 2>>"$LOG"; then
  log "FAIL: restore into $TEST_DB failed"
  alert_fail "[CashPro] Restore drill FAILED: restore error" "Restoring $LATEST into a scratch database failed. See log for the SQL error."
  exit 1
fi
log "restore into $TEST_DB succeeded"

OVERALL_OK=1
MISMATCHES=""
for t in $TABLES; do
  LIVE=$(mysql -N -e "SELECT COUNT(*) FROM cashpro.$t" 2>>"$LOG")
  RESTORED=$(mysql -N -e "SELECT COUNT(*) FROM $TEST_DB.$t" 2>>"$LOG")
  if [ "$LIVE" == "$RESTORED" ]; then
    log "  $t: OK (live=$LIVE restored=$RESTORED)"
  else
    log "  $t: MISMATCH (live=$LIVE restored=$RESTORED)"
    OVERALL_OK=0
    MISMATCHES="$MISMATCHES\n  $t: live=$LIVE restored=$RESTORED"
  fi
done

if [ "$OVERALL_OK" -eq 1 ]; then
  log "=== restore drill PASSED ==="
  exit 0
else
  log "=== restore drill FAILED: row count mismatch ==="
  alert_fail "[CashPro] Restore drill FAILED: row count mismatch" "Backup used: $LATEST\n\nMismatched tables:$MISMATCHES"
  exit 1
fi
