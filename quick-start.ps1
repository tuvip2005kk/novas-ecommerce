# Quick Start Script for Local Development (Windows)

Write-Host "🚀 Novas E-Commerce - Quick Start" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend .env exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  Backend .env not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env - Please edit with your database credentials" -ForegroundColor Green
    Write-Host ""
}

# Check if frontend .env.local exists
if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  Frontend .env.local not found. Creating..." -ForegroundColor Yellow
    "NEXT_PUBLIC_API_URL=http://localhost:3001" | Out-File -FilePath "frontend\.env.local" -Encoding utf8
    Write-Host "✅ Created frontend\.env.local" -ForegroundColor Green
    Write-Host ""
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Run migrations (optional)
$runMigrations = Read-Host "Do you want to run database migrations now? (y/n)"
if ($runMigrations -eq 'y' -or $runMigrations -eq 'Y') {
    Write-Host "🗄️  Running Prisma migrations..." -ForegroundColor Cyan
    npx prisma migrate dev
    Write-Host "✅ Migrations completed" -ForegroundColor Green
    
    $seedDb = Read-Host "Do you want to seed the database? (y/n)"
    if ($seedDb -eq 'y' -or $seedDb -eq 'Y') {
        Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
        npx prisma db seed
        Write-Host "✅ Database seeded" -ForegroundColor Green
    }
}

Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

Set-Location ..

Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Cyan
Write-Host "  Backend:  cd backend && npm run start:dev" -ForegroundColor White
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Default admin: admin@novas.vn / admin123" -ForegroundColor Yellow
