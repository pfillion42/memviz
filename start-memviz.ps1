# memviz - Demarrage des serveurs avec icone systray
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "SilentlyContinue"
$Host.UI.RawUI.WindowTitle = "memviz"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-Port($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Where-Object State -eq 'Listen'
    return $null -ne $conn
}

function Stop-MemvizServices {
    foreach ($port in 3001, 5173) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# --- Demarrage serveur API (port 3001) ---
if (-not (Test-Port 3001)) {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$root\server`" && npm run dev" `
        -WindowStyle Hidden
}

# --- Demarrage frontend (port 5173) ---
if (-not (Test-Port 5173)) {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$root\client`" && npm run dev" `
        -WindowStyle Hidden
}

# --- Attente du serveur API (max 60 sec) ---
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

# --- Attente du frontend (max 60 sec) ---
$elapsed = 0
while ($elapsed -lt $timeout) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep -Seconds 2
    $elapsed += 2
}

# --- Ouvrir le navigateur ---
Start-Process "http://localhost:5173/"

# --- Icone systray ---
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = New-Object System.Drawing.Icon("$root\memviz.ico")
$notifyIcon.Text = "memviz - http://localhost:5173"
$notifyIcon.Visible = $true

# Menu contextuel (clic droit)
$menu = New-Object System.Windows.Forms.ContextMenuStrip

$menuOpen = $menu.Items.Add("Ouvrir memviz")
$menuOpen.Add_Click({
    Start-Process "http://localhost:5173/"
})

$menu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$menuStop = $menu.Items.Add("Arreter memviz")
$menuStop.Image = [System.Drawing.SystemIcons]::Error.ToBitmap()
$menuStop.Add_Click({
    Stop-MemvizServices
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$notifyIcon.ContextMenuStrip = $menu

# Double-clic ouvre le navigateur
$notifyIcon.Add_DoubleClick({
    Start-Process "http://localhost:5173/"
})

# Notification de demarrage
$notifyIcon.BalloonTipTitle = "memviz"
$notifyIcon.BalloonTipText = "Application demarree - http://localhost:5173"
$notifyIcon.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
$notifyIcon.ShowBalloonTip(3000)

# Boucle de messages Windows (garde le script en vie pour le systray)
[System.Windows.Forms.Application]::Run()
