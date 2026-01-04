# CODE CHO FE1 - COMPONENTS & ADMIN & CONFIG

## Danh sách files:

### Config (copy vào `frontend/`)
- `tailwind.config.ts`
- `postcss.config.js`
- `tsconfig.json`
- `components.json`

### UI Components (copy vào `frontend/components/ui/`)
- `ui/button.tsx`
- `ui/card.tsx`
- `ui/input.tsx`
- (tất cả files trong folder ui/)

### Components (copy vào `frontend/components/`)
- `Header.tsx`
- `Hero.tsx`
- `AdminSidebar.tsx`
- `LikeButton.tsx`
- `CartIcon.tsx`
- `ReviewsSection.tsx`
- `ReviewsWrapper.tsx`
- `SearchBar.tsx`
- `UserMenu.tsx`
- `ProductButtons.tsx`
- `HeaderWrapper.tsx`

### Admin pages (copy vào `frontend/app/admin/`)
- Tất cả trong folder `admin/`

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

### 🔹 Bước 3: Commit Config (Tuần 1)
```bash
git checkout -b feature/setup-config
```
**Copy các file sau vào `frontend/`:**
- `tailwind.config.ts`
- `postcss.config.js`
- `tsconfig.json`
- `components.json`

```bash
git add .
git commit -m "feat: Setup Tailwind and TypeScript config"
git push origin feature/setup-config
```
→ Tạo Pull Request trên GitHub

---

### 🔹 Bước 4: Commit UI Components (Tuần 2)
```bash
git checkout main && git pull
git checkout -b feature/ui-components
```
**Copy folder `ui/` vào `frontend/components/`**

```bash
git add .
git commit -m "feat: Add shadcn UI components"
git push origin feature/ui-components
```

---

### 🔹 Bước 5: Commit Header & Hero (Tuần 3)
```bash
git checkout main && git pull
git checkout -b feature/header-hero
```
**Copy vào `frontend/components/`:**
- `Header.tsx`
- `HeaderWrapper.tsx`
- `Hero.tsx`
- `UserMenu.tsx`
- `SearchBar.tsx`

```bash
git add .
git commit -m "feat: Add Header, Hero, and navigation components"
git push origin feature/header-hero
```

---

### 🔹 Bước 6: Commit Cart & Like (Tuần 4)
```bash
git checkout main && git pull
git checkout -b feature/cart-like-components
```
**Copy vào `frontend/components/`:**
- `CartIcon.tsx`
- `LikeButton.tsx`
- `ProductButtons.tsx`

```bash
git add .
git commit -m "feat: Add CartIcon, LikeButton, ProductButtons"
git push origin feature/cart-like-components
```

---

### 🔹 Bước 7: Commit Admin (Tuần 5)
```bash
git checkout main && git pull
git checkout -b feature/admin-dashboard
```
**Copy folder `admin/` vào `frontend/app/`**
**Copy vào `frontend/components/`:**
- `AdminSidebar.tsx`

```bash
git add .
git commit -m "feat: Build admin dashboard with sidebar"
git push origin feature/admin-dashboard
```

---

### 🔹 Bước 8: Commit Reviews (Tuần 6)
```bash
git checkout main && git pull
git checkout -b feature/reviews
```
**Copy vào `frontend/components/`:**
- `ReviewsSection.tsx`
- `ReviewsWrapper.tsx`

```bash
git add .
git commit -m "feat: Add product reviews feature"
git push origin feature/reviews
```

---

## ✅ SAU KHI HOÀN THÀNH:
Bạn sẽ có **8 commits** trong lịch sử Git!
