# NOVAS E-commerce - Hướng dẫn Team

## 🚀 Bắt đầu nhanh

### 1. Clone và cài đặt
```bash
git clone https://github.com/your-repo/novas-ecommerce.git
cd novas-ecommerce

# Cài đặt Backend
cd backend
npm install

# Cài đặt Frontend
cd ../frontend
npm install
```

### 2. Chạy local
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Truy cập
- Frontend: http://localhost:3000
- Backend API: http://localhost:3005

---

## 📋 Git Workflow

```bash
# 1. Pull code mới nhất
git pull origin main

# 2. Add files
git add -A

# 3. Commit
git commit -m "Tên task: Mô tả"

# 4. Push
git push origin main
```

---

## ✅ Đã hoàn thành
- [x] Trang Profile 3 tabs (Thông tin, Bảo mật, Nhật ký)
- [x] Fix ảnh sản phẩm
- [x] Fix đồng bộ trạng thái đơn hàng

---

## 🔧 Việc cần làm

### 1. Cloudinary (Lưu ảnh)
```bash
cd backend && npm install cloudinary multer-storage-cloudinary
```
- Tạo `backend/src/cloudinary/cloudinary.config.ts`
- Sửa `backend/src/upload/upload.controller.ts`

### 2. OTP Email
```bash
cd backend && npm install nodemailer
```
- Thêm `otpCode`, `otpExpires` vào User schema
- Tạo `backend/src/email/email.service.ts`

### 3. Google Authenticator
```bash
cd backend && npm install speakeasy qrcode
```
- Thêm `totpSecret` vào User schema
- Tạo API generate QR + verify TOTP

### 4. Admin Sản phẩm
- Tạo `frontend/app/admin/products/page.tsx`
- CRUD sản phẩm

### 5. Admin Danh mục
- Tạo `frontend/app/admin/categories/page.tsx`
- CRUD danh mục

---

## 📁 Cấu trúc code

```
├── frontend/           # Next.js
│   ├── app/           # Pages
│   ├── components/    # UI
│   └── config.ts      # API URL
│
├── backend/           # NestJS
│   ├── src/
│   │   ├── auth/     # Đăng nhập
│   │   ├── orders/   # Đơn hàng
│   │   └── products/ # Sản phẩm
│   └── prisma/schema.prisma
```

---

## 🌐 Deploy Links
- **Frontend**: https://novas-ecommerce.vercel.app
- **Backend**: https://positive-enjoyment-production-27aa.up.railway.app

---

## ⚠️ Lưu ý
- Luôn `git pull` trước khi code
- Đợi 2-3 phút sau push để Vercel/Railway deploy
- Nếu đổi database:
  ```bash
  cd backend
  npx prisma migrate dev --name ten_migration
  ```
