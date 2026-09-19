# CashPro VPS deployment files

Reference copies of everything installed on the VPS to run CashPro as an
isolated service alongside the existing ERP. None of these are used at
build/runtime by the app itself — they document and version-control the
server-side setup. Real hostnames, IPs, and email addresses are redacted to
placeholders (`YOUR_VPS_IP`, `ALERT_RECIPIENT_EMAIL`, etc.) — the actual
values only exist on the VPS and the admin workstation, never in git.

| File | Installs to | Purpose |
|---|---|---|
| `cashpro.service` | `/etc/systemd/system/cashpro.service` | Runs `node dist/server.js` as the dedicated `cashpro` OS user on port 3002 |
| `nginx-cashpro.conf` | `/etc/nginx/sites-available/cashpro` (symlinked into `sites-enabled`) | Reverse proxy + TLS for `cashpro.mineazy.com` -> `127.0.0.1:3002` |
| `backup-cashpro.sh` | `/root/backup-cashpro.sh` | Daily `mysqldump` of the `cashpro` database only, 14-day local retention |
| `cashpro-backup.cron` | `/etc/cron.d/cashpro-backup` | Runs the backup script daily at 02:30 UTC |
| `restore-drill-cashpro.sh` | `/root/restore-drill-cashpro.sh` | Monthly: restores the latest backup into a scratch DB, verifies row counts against live, emails on any failure |
| `cashpro-restore-drill.cron` | `/etc/cron.d/cashpro-restore-drill` | Runs the restore drill on the 1st of each month at 03:30 UTC |
| `msmtprc.example` | `/root/.msmtprc` (fill in real host/user/password first, then `chmod 600`) | SMTP config used by the restore drill to send failure alerts |
| `Sync-CashProBackups.ps1` | `C:\Users\Administrator\Scripts\Sync-CashProBackups.ps1` (Windows admin machine) | Pulls new backups from the VPS to a local off-site copy; scheduled daily via Windows Task Scheduler ("CashPro Offsite Backup Sync") |

## Isolation from the ERP

- Dedicated OS user `cashpro` (own `/opt/cashpro` home), separate from the ERP's PM2/root setup and the `mineazy` service's own user.
- Dedicated MySQL database `cashpro` + user `cashpro_user@localhost`, scoped with `GRANT ALL PRIVILEGES ON cashpro.*` only — cannot see `mineazy_erp` or any other database.
- Own nginx site/subdomain, own systemd unit, own port (3002) — the ERP (port 3001, PM2) and `tocollect` (port 3100, systemd) are untouched by any of this.
- MySQL still only listens on `127.0.0.1`; nothing here opens it to the network.

## Secrets and identifying details not in this folder

`/opt/cashpro/.env` (DB connection string) and the real `/root/.msmtprc`
(SMTP host/user/password) live only on the VPS and are never committed.
The VPS's real IP address and the real alert email addresses have been
replaced with placeholders in every file above — fill them in locally
after copying a file out, never commit the filled-in version.
