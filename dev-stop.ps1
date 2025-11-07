# Script para parar o ambiente de desenvolvimento
# Uso: .\dev-stop.ps1

Write-Host "🛑 Parando ambiente de desenvolvimento do ERP..." -ForegroundColor Yellow
Write-Host ""

docker-compose down

Write-Host ""
Write-Host "✅ Ambiente parado com sucesso!" -ForegroundColor Green
Write-Host ""
