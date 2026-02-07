# Hướng Dẫn Cập Nhật Thanh Toán Tự Động

## Tổng Quan

Hệ thống thanh toán sử dụng SePay webhook để tự động cập nhật trạng thái đơn hàng khi khách hàng chuyển khoản thành công.

## Vấn Đề Hiện Tại

**Webhook fails vì Render Free Tier cold start:**
- Backend sleep sau 15 phút không hoạt động
- SePay gửi webhook nhưng backend chưa kịp wake up
- Webhook timeout → Order không được cập nhật

## Giải Pháp 1: Keep-Alive Service (Khuyến Nghị)

### Bước 1: Đăng Ký cron-job.org

1. Truy cập: https://cron-job.org/en/
2. Đăng ký tài khoản miễn phí
3. Verify email

### Bước 2: Tạo Cron Job

1. Click **"Create cronjob"**
2. Điền thông tin:
   - **Title:** `Novas Backend Keep-Alive`
   - **URL:** `https://novas-ecommerce.onrender.com/`
   - **Schedule:** Every **10 minutes**
   - **HTTP Method:** GET
   - **Timeout:** 30 seconds

3. Click **"Create"**

### Bước 3: Verify

- Đợi 10 phút
- Check cron-job.org dashboard
- Xem "Last execution" có success không

**Kết quả:** Backend sẽ luôn awake, webhook sẽ hoạt động!

---

## Giải Pháp 2: Manual Confirmation (Fallback)

Nếu webhook vẫn fail, dùng manual endpoint:

### API Endpoint

```
POST https://novas-ecommerce.onrender.com/api/sepay/confirm-payment/{orderId}
```

### Ví Dụ

Order ID = 5:
```bash
curl -X POST https://novas-ecommerce.onrender.com/api/sepay/confirm-payment/5
```

PowerShell:
```powershell
Invoke-WebRequest -Uri "https://novas-ecommerce.onrender.com/api/sepay/confirm-payment/5" -Method POST
```

---

## Cách Sử Dụng Hệ Thống

### Quy Trình Tự Động (Khi Keep-Alive Hoạt Động)

1. **Khách hàng đặt hàng** → Nhận Order ID (ví dụ: DH5)
2. **Khách hàng chuyển khoản:**
   - Ngân hàng: TPBank
   - STK: 10000606788
   - Tên: VUONG XUAN TU
   - Nội dung: **DH5** (chính xác!)
   - Số tiền: Đúng số tiền đơn hàng

3. **SePay nhận giao dịch** → Gửi webhook đến backend
4. **Backend xử lý:**
   - Parse order ID từ nội dung (DH5 → 5)
   - Tìm order #5
   - Cập nhật status: "Đã thanh toán"
   - Trừ stock sản phẩm

5. **Khách hàng thấy status updated** trên trang order

### Quy Trình Thủ Công (Khi Webhook Fail)

1. **Khách hàng chuyển khoản** (như trên)
2. **Admin kiểm tra bank statement** → Xác nhận đã nhận tiền
3. **Admin gọi API:**
   ```
   POST /api/sepay/confirm-payment/{orderId}
   ```
4. **Order status updated**

---

## Troubleshooting

### Webhook Không Hoạt Động

**Kiểm tra:**

1. **SePay Dashboard:**
   - Webhook URL đúng: `https://novas-ecommerce.onrender.com/api/sepay/webhook`
   - Status: "Kích hoạt"
   - Check "Thông kê gửi" → Nếu có failed calls, xem lỗi gì

2. **Render Logs:**
   - Vào Render Dashboard → Logs
   - Search: "SEPAY WEBHOOK"
   - Xem có nhận được request không

3. **Nội Dung Chuyển Khoản:**
   - Phải đúng format: `DH{số}`
   - Viết HOA: `DH5` ✅ (không phải `dh5` ❌)
   - Không có khoảng trắng: `DH5` ✅ (không phải `DH 5` ❌)

### Order Không Update

**Nguyên nhân:**

1. **Backend sleeping** → Setup keep-alive
2. **Nội dung sai** → Kiểm tra lại format
3. **Order ID không tồn tại** → Check database

**Giải pháp:**
- Dùng manual confirmation endpoint
- Check Render logs để debug

---

## Technical Details

### Webhook Endpoint

```typescript
POST /api/sepay/webhook

// Payload từ SePay
{
  "id": 123456,
  "gateway": "TPBank",
  "transactionDate": "2026-02-07T10:00:00Z",
  "accountNumber": "10000606788",
  "content": "DH5",
  "transferType": "in",
  "transferAmount": 50000,
  "accumulated": 1000000
}
```

### Backend Processing

1. Validate `transferType === 'in'`
2. Parse order ID: `DH5` → `5`
3. Find order in database
4. Update status to "Đã thanh toán"
5. Decrement product stock
6. Return success response

---

## Monitoring

### Check Webhook Health

1. **SePay Dashboard:**
   - "Thông kê gửi" → Should show success rate
   - Hôm nay: X / Y (X success, Y total)

2. **Render Logs:**
   - Search: "Payment confirmed"
   - Should see logs for each successful payment

3. **cron-job.org Dashboard:**
   - "Last execution" should be < 10 minutes ago
   - Status: Success

---

## Summary

✅ **Automatic (Recommended):**
- Setup keep-alive cron job
- Webhook tự động cập nhật
- Không cần can thiệp

⚠️ **Manual (Fallback):**
- Dùng khi webhook fail
- Admin confirm payment thủ công
- Reliable nhưng mất thời gian

**Khuyến nghị:** Setup keep-alive ngay để webhook hoạt động 24/7!
