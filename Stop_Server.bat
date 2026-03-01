@echo off
echo Stopping Aesthetic Job Board Server...
echo ====================================

:: Use PowerShell to find and kill the process listening on port 5000
powershell -Command "$port = 5000; $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($process) { Stop-Process -Id $process.OwningProcess -Force; Write-Host 'Flask server running on port 5000 has been officially stopped.' } else { Write-Host 'No running Flask server found on port 5000.' }"

echo.
pause
