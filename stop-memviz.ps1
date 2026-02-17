# memviz - Arret des serveurs
Write-Host "[memviz] Arret des serveurs..." -ForegroundColor Yellow

foreach ($port in 3001, 5173) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $procId = $conn.OwningProcess
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "[memviz] Arret port $port - $($proc.ProcessName) (PID $procId)" -ForegroundColor Cyan
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "[memviz] Serveurs arretes." -ForegroundColor Green
