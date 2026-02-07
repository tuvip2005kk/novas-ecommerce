# 🎯 QUICK DEPLOYMENT CHECKLIST

Làm theo các bước này để deploy web lên Render + Vercel + Aiven (MIỄN PHÍ)

---

## ✅ Bước 1: Setup Database (5 phút)

1. Truy cập: **https://aiven.io/**
2. Sign up (dùng email hoặc GitHub)
3. Create Service → Chọn **MySQL**
4. Chọn Region: **Singapore**
5. Chọn Plan: **Startup-4 (FREE)**
6. Đặt tên: `novas-mysql`
7. Đợi 2-3 phút
8. Copy **Service URI** (connection string)

**Lưu lại**: `mysql://user:password@host:port/defaultdb?ssl-mode=REQUIRED`

---

## ✅ Bước 2: Push Code lên GitHub

```bash
# Nếu chưa có Git repo
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Tạo repo mới trên GitHub, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/novas-ecommerce.git
git push -u origin main
```

---

## ✅ Bước 3: Deploy Backend lên Render (10 phút)

1. Truy cập: **https://render.com/**
2. Sign up với GitHub
3. New + → **Web Service**
4. Connect repo: `novas-ecommerce`
5. Cấu hình:
   - **Name**: `novas-backend`
   - **Region**: Singapore
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Free

6. **Environment Variables**:
   ```
   DATABASE_URL = <paste connection string từ Aiven>
   JWT_SECRET = my-super-secret-jwt-key-2024
   NODE_ENV = production
   PORT = 3000
   ```

7. Click **Create Web Service**
8. Đợi build xong (5-10 phút)
9. **Lưu lại URL**: `https://novas-backend.onrender.com`

### Chạy Database Migrations

1. Trong Render Dashboard → Tab **Shell**
2. Click **Launch Shell**
3. Chạy:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## ✅ Bước 4: Deploy Frontend lên Vercel (5 phút)

1. Truy cập: **https://vercel.com/**
2. Sign up với GitHub
3. Add New → **Project**
4. Import repo: `novas-ecommerce`
5. Cấu hình:
   - **Framework**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`

6. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL = <paste URL backend từ Render>
   ```
   Ví dụ: `https://novas-backend.onrender.com`

7. Click **Deploy**
8. Đợi deploy xong (2-3 phút)
9. **Lưu lại URL**: `https://novas-ecommerce.vercel.app`

---

## ✅ Bước 5: Kiểm Tra

### Test Backend
Mở trình duyệt: `https://novas-backend.onrender.com/`
→ Phải thấy: "Server is Up!"

Test API: `https://novas-backend.onrender.com/api/products`
→ Phải thấy danh sách sản phẩm

### Test Frontend
Mở: `https://novas-ecommerce.vercel.app`
- Trang chủ hiển thị sản phẩm ✅
- Login với: `admin@novas.vn` / `admin123` ✅
- Tạo đơn hàng thử ✅

### Test Auto-Deployment
```bash
# Sửa file bất kỳ
echo "# Test" >> README.md

# Push lên GitHub
git add .
git commit -m "test: auto deployment"
git push

# Kiểm tra Render và Vercel tự động deploy ✅
```

---

## 🎉 XONG!

Từ giờ, mỗi khi bạn push code lên GitHub:
```bash
git push
```
→ Render và Vercel sẽ **TỰ ĐỘNG** deploy! 🚀

---

## 📝 Thông Tin Quan Trọng

**Admin Account**:
- Email: `admin@novas.vn`
- Password: `admin123`

**URLs**:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`
- Database: Aiven Dashboard

---

## ❓ Gặp Vấn Đề?

### Backend không start
- Check logs trong Render Dashboard
- Verify `DATABASE_URL` đúng format
- Đảm bảo đã chạy migrations

### Frontend không kết nối backend
- Check `NEXT_PUBLIC_API_URL` trong Vercel
- Verify backend URL đúng
- Check CORS settings

### Database connection failed
- Verify Aiven service đang chạy
- Check connection string có `ssl-mode=REQUIRED`

---

## 📚 Tài Liệu Chi Tiết

Xem file [`DEPLOYMENT.md`](./DEPLOYMENT.md) để biết thêm chi tiết!
