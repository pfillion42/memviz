# memviz - Arret des serveurs
Write-Host "[memviz] Arret des serveurs..." -ForegroundColor Yellow

foreach ($port in 3001, 5173) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "[memviz] Arret port $port - $($proc.ProcessName) (PID $pid)" -ForegroundColor Cyan
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "[memviz] Serveurs arretes." -ForegroundColor Green
