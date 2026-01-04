# CODE CHO FE2 - PAGES & CONTEXT

## Danh sách files:

### Context (copy vào `frontend/context/`)
- `AuthContext.tsx`
- `CartContext.tsx`

### Components (copy vào `frontend/components/`)
- `ProductList.tsx`
- `ProductListClient.tsx`

### App files (copy vào `frontend/app/`)
- `page.tsx` (trang chủ)
- `layout.tsx`
- `globals.css`

### Pages (copy vào `frontend/app/`)
- `login/` (folder)
- `register/` (folder)
- `cart/` (folder)
- `checkout/` (folder)
- `products/` (folder)
- `likes/` (folder)

---

## HƯỚNG DẪN TỪNG BƯỚC:

### 🔹 Bước 1: Clone repo
```bash
git clone https://github.com/tuvip2005kk/do-an-webtbvs.git
cd do-an-webtbvs
```

### 🔹 Bước 2: Cài đặt
```bash
cd frontend
npm install
```

### 🔹 Bước 3: Commit Layout & Styles (Tuần 1)
```bash
git checkout -b feature/layout-styles
```
**Copy vào `frontend/app/`:**
- `layout.tsx`
- `globals.css`

```bash
git add .
git commit -m "feat: Setup layout and global styles"
git push origin feature/layout-styles
```
→ Tạo Pull Request trên GitHub

---

### 🔹 Bước 4: Commit Auth Context & Pages (Tuần 2)
```bash
git checkout main && git pull
git checkout -b feature/auth-pages
```
**Tạo folder `frontend/context/` và copy:**
- `AuthContext.tsx`
- `CartContext.tsx`

**Copy vào `frontend/app/`:**
- folder `login/`
- folder `register/`

```bash
git add .
git commit -m "feat: Add authentication context and login/register pages"
git push origin feature/auth-pages
```

---

### 🔹 Bước 5: Commit ProductList (Tuần 3)
```bash
git checkout main && git pull
git checkout -b feature/product-list
```
**Copy vào `frontend/components/`:**
- `ProductList.tsx`
- `ProductListClient.tsx`

**Copy vào `frontend/app/`:**
- folder `products/`

**Copy vào `frontend/app/`:**
- `page.tsx` (trang chủ - sử dụng ProductList)

```bash
git add .
git commit -m "feat: Add product listing and detail pages"
git push origin feature/product-list
```

---

### 🔹 Bước 6: Commit Cart & Checkout (Tuần 4)
```bash
git checkout main && git pull
git checkout -b feature/cart-checkout
```
**Copy vào `frontend/app/`:**
- folder `cart/`
- folder `checkout/`

```bash
git add .
git commit -m "feat: Add shopping cart and checkout pages"
git push origin feature/cart-checkout
```

---

### 🔹 Bước 7: Commit Likes (Tuần 6)
```bash
git checkout main && git pull
git checkout -b feature/likes-page
```
**Copy vào `frontend/app/`:**
- folder `likes/`

```bash
git add .
git commit -m "feat: Add favorites/likes page"
git push origin feature/likes-page
```

---

## ✅ SAU KHI HOÀN THÀNH:
Bạn sẽ có **5 commits** trong lịch sử Git!
