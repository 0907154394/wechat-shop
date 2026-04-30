# WeChat Shop VN

Web bán tài khoản WeChat tự động — thanh toán ngân hàng VN, giao hàng tức thì.

## Tech Stack

- **Next.js 14** (App Router) — deploy miễn phí trên Vercel
- **Supabase** — Database (PostgreSQL) + Auth + Realtime (miễn phí)
- **Casso.vn** — Webhook nhận tiền ngân hàng VN tự động (miễn phí)
- **VietQR** — Tạo QR chuyển khoản (miễn phí)
- **Resend** — Gửi email thông báo (miễn phí 3000/tháng)

## Setup (khoảng 30 phút)

### 1. Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor** → chạy toàn bộ file `supabase/schema.sql`
3. Vào **Authentication → Providers** → bật **Google**
   - Cần Google Client ID & Secret từ [Google Cloud Console](https://console.cloud.google.com)
   - Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Lấy keys từ **Settings → API**

### 2. Casso.vn

1. Đăng ký tại [casso.vn](https://casso.vn)
2. Liên kết tài khoản ngân hàng
3. Vào **Webhook** → thêm URL: `https://your-domain.vercel.app/api/webhook/casso`
4. Copy **Secure Token** → điền vào `CASSO_WEBHOOK_SECRET`

### 3. Resend

1. Đăng ký tại [resend.com](https://resend.com)
2. Tạo API key
3. Xác thực domain (hoặc dùng `onboarding@resend.dev` để test)

### 4. Deploy lên Vercel

```bash
npm i -g vercel
vercel
```

Điền tất cả env vars trong Vercel Dashboard → Settings → Environment Variables.

### 5. Local development

```bash
cp .env.example .env.local
# Điền đầy đủ các giá trị

npm run dev
```

## Cấu trúc thư mục

```
app/
  page.tsx              # Homepage
  products/             # Trang sản phẩm
  orders/               # Quản lý đơn hàng (yêu cầu đăng nhập)
  admin/                # Trang quản trị (yêu cầu ADMIN_EMAILS)
  auth/callback/        # OAuth callback
  api/webhook/casso/    # Webhook nhận tiền từ Casso

lib/
  supabase/             # Supabase client (browser + server)
  utils.ts              # Helper: formatVND, generateOrderCode, buildVietQRUrl
  types.ts              # TypeScript types
  email.ts              # Resend email templates

supabase/
  schema.sql            # Toàn bộ DB schema + RLS policies + functions
```

## Luồng hoạt động

```
1. Khách xem sản phẩm → đăng nhập Google
2. Nhấn "Mua ngay" → tạo order với mã DH-XXXXXXXX
3. Hiển thị QR VietQR + hướng dẫn chuyển khoản
4. Khách CK đúng số tiền + nội dung = mã đơn
5. Casso detect giao dịch → POST webhook đến /api/webhook/casso
6. Server tìm order theo mã đơn trong nội dung CK
7. Gọi DB function deliver_order_accounts → gán acc vào order
8. Gửi email + hiển thị acc trên trang đơn hàng
```

## Admin

Truy cập `/admin` với email trong biến `ADMIN_EMAILS`.

- **Thêm sản phẩm**: `/admin/products`
- **Nhập kho acc**: `/admin/accounts` (bulk import `username|password|phone|email`)
- **Xem đơn hàng**: `/admin/orders`
