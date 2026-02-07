# 🚀 Hướng Dẫn Deploy Full-Stack

## Tổng Quan
- **Backend**: Render (NestJS + Prisma)
- **Frontend**: Vercel (Next.js 14)
- **Database**: Aiven (MySQL)

---

## Bước 1: Setup Database trên Aiven

### 1.1. Tạo tài khoản Aiven
1. Truy cập: https://aiven.io/
2. Click **"Sign Up"** (dùng email hoặc GitHub)
3. Xác nhận email

### 1.2. Tạo MySQL Service
1. Sau khi đăng nhập, click **"Create Service"**
2. Chọn **"MySQL"**
3. Chọn **Cloud Provider**: AWS hoặc Google Cloud
4. Chọn **Region**: Singapore (gần Việt Nam nhất)
5. Chọn **Plan**: **"Startup-4"** (Free plan - 1GB storage)
6. Đặt tên service: `novas-mysql`
7. Click **"Create Service"**
8. Đợi 2-3 phút để service khởi động

### 1.3. Lấy Connection String
1. Vào service `novas-mysql` vừa tạo
2. Tab **"Overview"** → tìm **"Connection Information"**
3. Copy **"Service URI"** (dạng: `mysql://user:password@host:port/defaultdb?ssl-mode=REQUIRED`)
4. **LƯU LẠI** connection string này

---

## Bước 2: Deploy Backend lên Render

### 2.1. Tạo tài khoản Render
1. Truy cập: https://render.com/
2. Click **"Get Started"** → Sign up với GitHub
3. Authorize Render truy cập GitHub repos

### 2.2. Push code lên GitHub (nếu chưa)
```bash
# Trong thư mục dự án
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/novas-ecommerce.git
git push -u origin main
```

### 2.3. Tạo Web Service trên Render
1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect GitHub repository: `novas-ecommerce`
3. Cấu hình:
   - **Name**: `novas-backend`
   - **Region**: Singapore
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Free

4. Click **"Advanced"** → Add Environment Variables:
   - `DATABASE_URL` = (paste connection string từ Aiven)
   - `JWT_SECRET` = (tạo random string, ví dụ: `my-super-secret-jwt-key-2024`)
   - `NODE_ENV` = `production`
   - `PORT` = `3000`

5. Click **"Create Web Service"**
6. Đợi build xong (5-10 phút)
7. **LƯU LẠI** URL backend (dạng: `https://novas-backend.onrender.com`)

### 2.4. Run Database Migrations
1. Trong Render Dashboard → Service `novas-backend`
2. Tab **"Shell"** → Click **"Launch Shell"**
3. Chạy lệnh:
```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Bước 3: Deploy Frontend lên Vercel

### 3.1. Tạo tài khoản Vercel
1. Truy cập: https://vercel.com/
2. Click **"Sign Up"** → Sign up với GitHub
3. Authorize Vercel

### 3.2. Import Project
1. Click **"Add New..."** → **"Project"**
2. Import repository: `novas-ecommerce`
3. Cấu hình:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = (paste URL backend từ Render, ví dụ: `https://novas-backend.onrender.com`)

5. Click **"Deploy"**
6. Đợi deploy xong (2-3 phút)
7. **LƯU LẠI** URL frontend (dạng: `https://novas-ecommerce.vercel.app`)

---

## Bước 4: Kiểm Tra

### 4.1. Test Backend
```bash
# Test health check
curl https://novas-backend.onrender.com/

# Test API
curl https://novas-backend.onrender.com/api/products
```

### 4.2. Test Frontend
1. Mở trình duyệt: `https://novas-ecommerce.vercel.app`
2. Kiểm tra:
   - Trang chủ hiển thị sản phẩm
   - Login với: `admin@novas.vn` / `admin123`
   - Tạo đơn hàng thử

### 4.3. Test Auto-Deployment
```bash
# Sửa file bất kỳ
echo "# Test" >> README.md

# Push lên GitHub
git add .
git commit -m "test: auto deployment"
git push

# Kiểm tra Render và Vercel tự động deploy
```

---

## Bước 5: Cấu Hình CORS (Nếu Cần)

Nếu frontend gặp lỗi CORS, update file backend:

**File**: `backend/src/main.ts`
```typescript
app.enableCors({
  origin: [
    'https://novas-ecommerce.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
});
```

---

## Troubleshooting

### Backend không start
- Kiểm tra logs trong Render Dashboard
- Verify `DATABASE_URL` đúng format
- Đảm bảo `start:prod` script trong `package.json` đúng

### Frontend không kết nối được backend
- Kiểm tra `NEXT_PUBLIC_API_URL` trong Vercel
- Verify CORS settings trong backend
- Check Network tab trong browser DevTools

### Database connection failed
- Verify Aiven service đang chạy
- Check connection string có `ssl-mode=REQUIRED`
- Test connection bằng MySQL client

---

## URLs Quan Trọng

Sau khi deploy xong, bạn sẽ có:

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Database**: Aiven Dashboard để quản lý

---

## Auto-Deployment Workflow

Từ giờ, mỗi khi bạn push code:

```bash
git add .
git commit -m "feature: new feature"
git push
```

→ Render và Vercel sẽ **TỰ ĐỘNG** build và deploy! 🎉
