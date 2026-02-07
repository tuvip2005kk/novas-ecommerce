# 🛍️ Novas E-Commerce Platform

Full-stack e-commerce platform for bathroom fixtures and accessories.

## 🚀 Tech Stack

### Backend
- **Framework**: NestJS
- **Database**: MySQL with Prisma ORM
- **Auth**: JWT + Passport
- **Payment**: SePay Integration
- **File Upload**: Cloudinary

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts

## 📦 Project Structure

```
novas-ecommerce/
├── backend/              # NestJS API
│   ├── src/
│   ├── prisma/          # Database schema & migrations
│   └── render.yaml      # Render deployment config
├── frontend/            # Next.js app
│   ├── app/            # App router pages
│   ├── components/     # React components
│   └── vercel.json     # Vercel deployment config
└── DEPLOYMENT.md       # Deployment guide
```

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Git

### Backend Setup

```bash
cd backend
npm install

# Setup database
cp .env.example .env
# Edit .env with your local MySQL credentials

# Run migrations
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run start:dev
```

Backend runs on: `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install

# Setup environment
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:3000`

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Database**: Aiven (MySQL free tier)
2. **Backend**: Render (750 hours/month free)
3. **Frontend**: Vercel (unlimited free)

Push to GitHub → Auto-deploy! 🎉

## 📝 Default Admin Account

```
Email: admin@novas.vn
Password: admin123
```

## 🔑 Environment Variables

### Backend (.env)
```env
DATABASE_URL="mysql://..."
JWT_SECRET="your-secret"
NODE_ENV="production"
FRONTEND_URL="https://your-app.vercel.app"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://your-backend.onrender.com"
```

## 📚 API Documentation

### Public Endpoints
- `GET /api/products` - List products
- `GET /api/categories` - List categories
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Admin Endpoints (requires JWT)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - List all orders

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

## 📄 License

Private project - All rights reserved

## 👥 Team

Novas Development Team
