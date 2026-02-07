#!/bin/bash

# Quick Start Script for Local Development

echo "🚀 Novas E-Commerce - Quick Start"
echo "================================="
echo ""

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env not found. Creating from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please edit with your database credentials"
    echo ""
fi

# Check if frontend .env.local exists
if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local not found. Creating..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > frontend/.env.local
    echo "✅ Created frontend/.env.local"
    echo ""
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Run migrations (optional - will fail if DB not configured)
read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️  Running Prisma migrations..."
    npx prisma migrate dev
    echo "✅ Migrations completed"
    
    read -p "Do you want to seed the database? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding database..."
        npx prisma db seed
        echo "✅ Database seeded"
    fi
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

cd ..

echo "✨ Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Default admin: admin@novas.vn / admin123"
