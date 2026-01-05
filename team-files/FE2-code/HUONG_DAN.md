# FE2 - PAGES & CONTEXT (Thời gian: 1.5 tháng)

## 📊 TỔNG QUAN
- **Vai trò**: Phát triển Pages và Context
- **Thư mục làm việc**: `frontend/app/`, `frontend/context/`
- **Tổng folders**: 12 folders + 3 files
- **Tổng commits**: 10 commits

---

## 📅 LỊCH COMMIT CHI TIẾT

### TUẦN 1 (6/1 - 12/1)
| Ngày | Files/Folders | Copy vào | Commit Message |
|------|---------------|----------|----------------|
| **8/1** | `layout.tsx`, `globals.css`, `page.tsx` | `frontend/app/` | "feat: Setup layout and styles" |
| **11/1** | folder `context/` | `frontend/` | "feat: Add Auth and Cart context" |

### TUẦN 2 (13/1 - 19/1)
| Ngày | Files/Folders | Copy vào | Commit Message |
|------|---------------|----------|----------------|
| **15/1** | folder `login/` | `frontend/app/` | "feat: Add login page" |
| **18/1** | folder `register/` | `frontend/app/` | "feat: Add register page" |

### TUẦN 3 (20/1 - 26/1)
| Ngày | Files/Folders | Copy vào | Commit Message |
|------|---------------|----------|----------------|
| **22/1** | folder `products/` | `frontend/app/` | "feat: Add products page" |
| **25/1** | folder `cart/` | `frontend/app/` | "feat: Add cart page" |

### TUẦN 4 (27/1 - 2/2)
| Ngày | Files/Folders | Copy vào | Commit Message |
|------|---------------|----------|----------------|
| **29/1** | folder `checkout/` | `frontend/app/` | "feat: Add checkout page" |
| **1/2** | folder `likes/` | `frontend/app/` | "feat: Add favorites page" |

### TUẦN 5 (3/2 - 9/2)
| Ngày | Files/Folders | Copy vào | Commit Message |
|------|---------------|----------|----------------|
| **5/2** | folder `[category]/` | `frontend/app/` | "feat: Add category pages" |
| **8/2** | folder `profile/`, folder `order/` | `frontend/app/` | "feat: Add profile and order pages" |

### TUẦN 6 (10/2 - 16/2)
| Ngày | Files/Folders | Copy vào | Commit Message |
|------|---------------|----------|----------------|
| **12/2** | folder `thiet-bi-ve-sinh/` | `frontend/app/` | "feat: Add static category page" |
| **15/2** | folder `admin/` | `frontend/app/` | "feat: Add admin dashboard" |

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

### Bước 3: Copy folder vào đúng thư mục
```bash
# Ví dụ ngày 15/1 - copy folder login vào frontend/app/
xcopy "login" "frontend/app/login/" /E /I /Y
```

### Bước 4: Add, commit và push
```bash
git add -A
git commit -m "feat: Add login page"
git push origin main
```

---

## ⚠️ LƯU Ý
- Commit đúng ngày theo lịch
- Luôn `git pull` trước khi làm
- Đợi 2-3 phút sau push để xem trên Vercel
