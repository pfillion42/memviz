# memviz - Demarrage des serveurs
$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-Port($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Where-Object State -eq 'Listen'
    return $null -ne $conn
}

# --- Serveur API (port 3001) ---
if (Test-Port 3001) {
    Write-Host "[memviz] Serveur API deja en cours sur le port 3001" -ForegroundColor Cyan
} else {
    Write-Host "[memviz] Demarrage du serveur API (port 3001)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$root\server`" && npm run dev" -WindowStyle Minimized
}

# --- Frontend (port 5173) ---
if (Test-Port 5173) {
    Write-Host "[memviz] Frontend deja en cours sur le port 5173" -ForegroundColor Cyan
} else {
    Write-Host "[memviz] Demarrage du frontend (port 5173)..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$root\client`" && npm run dev" -WindowStyle Minimized
}

# --- Attente des serveurs (max 60 sec chacun) ---
Write-Host "[memviz] Attente du demarrage..." -ForegroundColor Yellow

$timeout = 60
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:3001/api/health" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if ($elapsed -ge $timeout) {
    Write-Host "[memviz] ERREUR: Le serveur API n'a pas demarre apres $timeout secondes" -ForegroundColor Red
} else {
    Write-Host "[memviz] Serveur API pret." -ForegroundColor Green
}

$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep -Seconds 2
    $elapsed += 2
}
if ($elapsed -ge $timeout) {
    Write-Host "[memviz] ERREUR: Le frontend n'a pas demarre apres $timeout secondes" -ForegroundColor Red
} else {
    Write-Host "[memviz] Frontend pret." -ForegroundColor Green
}

# --- Ouvrir le navigateur ---
Write-Host "[memviz] Ouverture du navigateur..." -ForegroundColor Yellow
Start-Process "http://localhost:5173/"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  memviz demarre sur http://localhost:5173" -ForegroundColor Green
Write-Host "  API sur http://127.0.0.1:3001" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  Pour arreter : stop-memviz.bat" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
