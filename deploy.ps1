Write-Host "Iniciando processo de deploy..." -ForegroundColor Green

# 1. Build do projeto React
Write-Host "1. Construindo o projeto frontend (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build do frontend. Abortando." -ForegroundColor Red
    exit 1
}

# 2. Build da imagem Docker
Write-Host "2. Construindo imagem Docker (nucleo-admin-web)..." -ForegroundColor Yellow
docker build --no-cache --build-arg VITE_TAG_PRODUTO=APP_NUCLEO_ADMIN -t nucleo-admin-web:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build da imagem Docker. Abortando." -ForegroundColor Red
    exit 1
}

# 3. Subindo containers com Docker Compose
Write-Host "3. Iniciando containers (docker-compose up -d)..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao subir containers. Abortando." -ForegroundColor Red
    exit 1
}

Write-Host "Deploy concluído com sucesso!" -ForegroundColor Green
