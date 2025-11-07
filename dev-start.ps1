# Script de inicialização do ambiente de desenvolvimento
# Uso: .\dev-start.ps1

Write-Host "🚀 Iniciando ambiente de desenvolvimento do ERP..." -ForegroundColor Green
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🐳 Verificando Docker..." -ForegroundColor Cyan
$dockerRunning = docker info 2>&1 | Select-String "Server Version"
if (-not $dockerRunning) {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker está rodando" -ForegroundColor Green
Write-Host ""

# Copiar arquivos .env se não existirem
Write-Host "📋 Verificando arquivos de configuração..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Arquivo .env criado na raiz" -ForegroundColor Green
}
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Arquivo backend\.env criado" -ForegroundColor Green
}
if (-not (Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✅ Arquivo frontend\.env.local criado" -ForegroundColor Green
}
Write-Host ""

# Iniciar containers Docker
Write-Host "🐳 Iniciando containers Docker..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "✅ Ambiente iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Serviços disponíveis:" -ForegroundColor Yellow
Write-Host "  - Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend:   http://localhost:3001" -ForegroundColor White
Write-Host "  - Swagger:   http://localhost:3001/api/docs" -ForegroundColor White
Write-Host "  - Postgres:  localhost:5432" -ForegroundColor White
Write-Host "  - Redis:     localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comandos úteis:" -ForegroundColor Yellow
Write-Host "  - Ver logs:          docker-compose logs -f" -ForegroundColor White
Write-Host "  - Parar serviços:    docker-compose down" -ForegroundColor White
Write-Host "  - Prisma Studio:     cd backend; npx prisma studio" -ForegroundColor White
Write-Host ""
