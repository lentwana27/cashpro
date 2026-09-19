<#
Pulls new cashpro MySQL backup files from the VPS down to a local off-site
copy. Only copies files not already present locally; never deletes anything
locally (VPS-side retention is handled separately by /root/backup-cashpro.sh).
#>

$Key = "C:\Users\Administrator\.ssh\cashpro\id_ed25519"
$Host_ = "root@YOUR_VPS_IP"
$RemoteDir = "/root/db-backups/cashpro"
$LocalDir = "F:\CashPro Backups"
$LogFile = "C:\Users\Administrator\Scripts\cashpro-backup-sync.log"

function Write-Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Add-Content -Path $LogFile -Value $line
    Write-Output $line
}

if (-not (Test-Path $LocalDir)) {
    New-Item -ItemType Directory -Path $LocalDir -Force | Out-Null
}

try {
    $remoteListing = & ssh -i $Key -o BatchMode=yes -o ConnectTimeout=15 $Host_ "ls -1 $RemoteDir/*.sql.gz 2>/dev/null"
    if ($LASTEXITCODE -ne 0) {
        throw "ssh listing failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Log "ERROR: could not list remote backups - $_"
    exit 1
}

$remoteFiles = $remoteListing -split "`n" | Where-Object { $_.Trim() -ne "" }
$copied = 0
$failed = 0

foreach ($remotePath in $remoteFiles) {
    $remotePath = $remotePath.Trim()
    $fileName = Split-Path $remotePath -Leaf
    $localPath = Join-Path $LocalDir $fileName

    if (Test-Path $localPath) {
        continue
    }

    & scp -i $Key -o BatchMode=yes -o ConnectTimeout=15 "${Host_}:${remotePath}" $localPath 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -and (Test-Path $localPath)) {
        $copied++
        Write-Log "copied $fileName"
    } else {
        $failed++
        Write-Log "ERROR: failed to copy $fileName (exit $LASTEXITCODE)"
    }
}

Write-Log "sync complete: $copied new file(s) copied, $failed failed, $($remoteFiles.Count) total on VPS"

if ($failed -gt 0) { exit 1 }
