# FE1 - COMPONENTS (Thời gian: 1.5 tháng)

## 📊 TỔNG QUAN
- **Vai trò**: Phát triển Components UI
- **Thư mục làm việc**: `frontend/components/`
- **Tổng files**: 20 files
- **Tổng commits**: 10 commits

---

## 📅 LỊCH COMMIT CHI TIẾT

### TUẦN 1 (6/1 - 12/1)
| Ngày | Files | Copy vào | Commit Message |
|------|-------|----------|----------------|
| **8/1** | `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `components.json` | `frontend/` | "feat: Setup project config" |
| **11/1** | folder `ui/` | `frontend/components/` | "feat: Add UI base components" |

### TUẦN 2 (13/1 - 19/1)
| Ngày | Files | Copy vào | Commit Message |
|------|-------|----------|----------------|
| **15/1** | `Header.tsx`, `HeaderWrapper.tsx`, `SearchBar.tsx` | `frontend/components/` | "feat: Add Header components" |
| **18/1** | `Hero.tsx`, `UserMenu.tsx` | `frontend/components/` | "feat: Add Hero and UserMenu" |

### TUẦN 3 (20/1 - 26/1)
| Ngày | Files | Copy vào | Commit Message |
|------|-------|----------|----------------|
| **22/1** | `CartIcon.tsx`, `LikeButton.tsx`, `ProductButtons.tsx` | `frontend/components/` | "feat: Add Cart and Like buttons" |
| **25/1** | `ProductList.tsx`, `ProductListClient.tsx` | `frontend/components/` | "feat: Add ProductList components" |

### TUẦN 4 (27/1 - 2/2)
| Ngày | Files | Copy vào | Commit Message |
|------|-------|----------|----------------|
| **29/1** | `BannerCarousel.tsx`, `CategorySection.tsx` | `frontend/components/` | "feat: Add Banner and Category" |
| **1/2** | `TrendingSection.tsx`, `CommitmentSection.tsx` | `frontend/components/` | "feat: Add Trending and Commitment" |

### TUẦN 5 (3/2 - 9/2)
| Ngày | Files | Copy vào | Commit Message |
|------|-------|----------|----------------|
| **5/2** | `Footer.tsx`, `ShowroomBanner.tsx` | `frontend/components/` | "feat: Add Footer and Showroom" |
| **8/2** | `PaymentQR.tsx`, `ReviewsSection.tsx`, `ReviewsWrapper.tsx` | `frontend/components/` | "feat: Add Payment and Reviews" |

### TUẦN 6 (10/2 - 16/2)
| Ngày | Files | Copy vào | Commit Message |
|------|-------|----------|----------------|
| **12/2** | `AdminSidebar.tsx` | `frontend/components/` | "feat: Add AdminSidebar component" |

---

## 📋 HƯỚNG DẪN COMMIT

### Bước 1: Clone starter-project về máy (lần đầu)
```bash
git clone https://github.com/[username]/starter-project.git
cd starter-project
```

### Bước 2: Pull code mới nhất (mỗi lần làm)
```bash
git pull origin main
```

### Bước 3: Copy files vào đúng thư mục
```bash
# Ví dụ ngày 8/1 - copy config files vào frontend/
copy "tailwind.config.ts" "frontend/"
copy "postcss.config.js" "frontend/"
```

### Bước 4: Add, commit và push
```bash
git add -A
git commit -m "ncggdg"
git push origin main
```

---

## ⚠️ LƯU Ý
- Commit đúng ngày theo lịch
- Luôn `git pull` trước khi làm
- Đợi 2-3 phút sau push để xem trên Vercel
