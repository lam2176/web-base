# Deploy lên AWS

Hướng dẫn chạy NextShop trên AWS: **backend NestJS trên EC2** (Docker + Caddy tự cấp HTTPS) và **frontend Next.js trên AWS Amplify Hosting**. Database và ảnh **vẫn dùng Supabase** nên không phải chuyển dữ liệu hay sửa code.

```
Trình duyệt ──► Amplify Hosting (Next.js, SSR)  ── NEXT_PUBLIC_API_URL ──►  EC2: Caddy :443 ──► NestJS :3000
                                                                                    │
                                                                       Supabase (Postgres + Storage)
```

Các file liên quan trong repo:

| File | Vai trò |
|---|---|
| `backend/Dockerfile` | Build image backend (Node 22, chạy bằng user `node`, có healthcheck) |
| `deploy/ec2/docker-compose.yml` | Chạy backend + Caddy trên EC2 |
| `deploy/ec2/Caddyfile` | Reverse proxy, tự xin chứng chỉ HTTPS Let's Encrypt |
| `deploy/ec2/.env.example` | Tên miền API (`API_DOMAIN`) |
| `amplify.yml` | Cấu hình build frontend trên Amplify (monorepo, thư mục `frontend`) |
| `.github/workflows/deploy-backend-ec2.yml` | Tự deploy backend lên EC2 mỗi lần push thay đổi trong `backend/` |
| `.github/workflows/keep-alive.yml` | Gọi API mỗi ngày để Supabase gói miễn phí không bị tạm dừng |

---

## 0. Chuẩn bị

1. **Tài khoản AWS.** Sau khi tạo, bật MFA cho tài khoản root và tạo một IAM user có quyền quản trị để dùng hằng ngày, không dùng root.
2. **Đặt cảnh báo chi phí ngay**: Billing → **Budgets** → *Create budget* → *Zero spend budget* hoặc *Monthly cost budget* (ví dụ 5 USD) → nhập email nhận cảnh báo.
3. **Chọn region `ap-northeast-1` (Tokyo)**: cùng khu vực với Supabase của project (`aws-0-ap-northeast-1.pooler.supabase.com`). Mỗi request backend gọi database nhiều lần, nên đặt gần database quan trọng hơn đặt gần người dùng.
4. **Chi phí cần biết:** ưu đãi miễn phí cho tài khoản mới thay đổi theo thời kỳ, xem tại https://aws.amazon.com/free. Ngoài giờ chạy máy, AWS **tính phí theo giờ cho địa chỉ IPv4 công khai** (kể cả Elastic IP). Khi không dùng nữa, nhớ *Terminate* máy **và** *Release* Elastic IP (mục 6).
5. (Tuỳ chọn) **Tên miền**, ví dụ `api.tenmien.com`. Chưa có tên miền thì dùng dạng miễn phí `<ip-gạch-ngang>.sslip.io` (xem bước 1.6).

---

## 1. Backend trên EC2

### 1.1. Tạo máy ảo
EC2 → **Launch instance**:

| Mục | Giá trị |
|---|---|
| Name | `base-sale-shop-api` |
| AMI | **Ubuntu Server 24.04 LTS** |
| Instance type | `t3.micro` (1 GB RAM, đủ chạy; build lần đầu hơi chậm) hoặc `t3.small` nếu muốn build nhanh |
| Key pair | *Create new key pair* → loại RSA, định dạng `.pem` → **lưu file này cẩn thận** |
| Storage | 20 GB gp3 |
| Security group | Cho phép **SSH (22) từ My IP**, **HTTP (80)** và **HTTPS (443)** từ Anywhere |

### 1.2. Gắn IP cố định
EC2 → **Elastic IPs** → *Allocate Elastic IP address* → chọn IP vừa tạo → *Actions → Associate* → chọn máy `base-sale-shop-api`.

### 1.3. Kết nối SSH
```bash
chmod 400 base-sale-shop.pem            # trên Windows Git Bash cũng chạy được
ssh -i base-sale-shop.pem ubuntu@<ELASTIC_IP>
```

### 1.4. Cài swap và Docker (chạy trên máy EC2)
`t3.micro` chỉ có 1 GB RAM, bước `npm ci` + `nest build` có thể hết bộ nhớ, nên thêm 2 GB swap:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit    # thoát rồi SSH vào lại để quyền docker có hiệu lực
```
Kiểm tra: `docker compose version`.

### 1.5. Lấy code và cấu hình bí mật
```bash
git clone https://github.com/lam2176/web-base.git ~/base-sale-shop
cd ~/base-sale-shop
cp backend/.env.example backend/.env
nano backend/.env
```
> Repo private? Tạo SSH key trên EC2 (`ssh-keygen -t ed25519`), thêm public key vào GitHub repo → *Settings → Deploy keys*, rồi clone bằng `git@github.com:lam2176/web-base.git`.

Điền `backend/.env` giống các biến đang đặt trên Vercel, chú ý:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Chuỗi **Transaction pooler** của Supabase (cổng `6543`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Như trên Vercel |
| `JWT_SECRET`, `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET` | **Giữ nguyên** giá trị cũ, đổi thì mọi người dùng bị đăng xuất |
| `ADMIN_JWT_ACCESS_TOKEN_EXPIRY` | `3h` |
| `GEMINI_API_KEY` | Key chatbot |
| `CORS_ORIGINS`, `FRONTEND_URL` | Tạm để domain Vercel; sửa thành domain Amplify ở bước 3 |
| `NODE_ENV`, `PORT` | Không cần, `docker-compose.yml` đã đặt |

Tên miền cho Caddy:
```bash
cp deploy/ec2/.env.example deploy/ec2/.env
nano deploy/ec2/.env      # API_DOMAIN=api.tenmien.com
```

### 1.6. Trỏ tên miền
- **Có tên miền:** tạo bản ghi DNS **A** `api` → `<ELASTIC_IP>`. Đợi vài phút cho DNS cập nhật (`nslookup api.tenmien.com`).
- **Chưa có:** dùng `API_DOMAIN=13-114-25-7.sslip.io` (thay bằng Elastic IP, dấu chấm đổi thành gạch ngang). Tên này tự trỏ về IP đó, và Caddy vẫn xin được HTTPS.

### 1.7. Chạy
```bash
cd ~/base-sale-shop
docker compose -f deploy/ec2/docker-compose.yml up -d --build
docker compose -f deploy/ec2/docker-compose.yml ps          # api phải "healthy"
curl https://<API_DOMAIN>/api/health
```
Swagger: `https://<API_DOMAIN>/docs`.

---

## 2. Tự deploy backend bằng GitHub Actions

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Giá trị |
|---|---|
| `EC2_HOST` | Elastic IP (hoặc tên miền API) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Toàn bộ nội dung file `.pem` |

Từ giờ, mỗi lần push lên `main` có thay đổi trong `backend/` hoặc `deploy/ec2/`, workflow **Deploy backend to EC2** sẽ SSH vào máy, cập nhật code, build lại và chờ API **healthy**. Chạy tay: tab **Actions → Deploy backend to EC2 → Run workflow**. Khi chưa đặt `EC2_HOST`, workflow tự bỏ qua nên không báo lỗi.

---

## 3. Frontend trên AWS Amplify

1. Amplify console → **Create new app** → **GitHub** → cấp quyền → chọn repo `web-base`, nhánh `main`.
2. Tick **My app is a monorepo** → đường dẫn `frontend`. Amplify sẽ đọc `amplify.yml` ở thư mục gốc repo (biến `AMPLIFY_MONOREPO_APP_ROOT=frontend` được tự đặt và phải khớp `appRoot`).
3. **Advanced settings → Environment variables:**
   ```
   NEXT_PUBLIC_API_URL = https://<API_DOMAIN>/api
   NEXT_PUBLIC_APP_URL = https://main.<app-id>.amplifyapp.com   (sửa lại sau khi biết domain)
   ```
   Biến `NEXT_PUBLIC_*` được gắn lúc build, nên **mỗi lần đổi phải Redeploy**.
4. **Save and deploy.** Xong sẽ có domain dạng `https://main.<app-id>.amplifyapp.com`. Muốn dùng tên miền riêng: *Hosting → Custom domains*.

## 4. Nối frontend với backend
Trên EC2, sửa `backend/.env`:
```
CORS_ORIGINS=https://main.<app-id>.amplifyapp.com
FRONTEND_URL=https://main.<app-id>.amplifyapp.com
```
Có thể ghi nhiều domain cách nhau bằng dấu phẩy, ví dụ để cả Vercel và Amplify cùng chạy song song. Sau đó áp dụng:
```bash
docker compose -f deploy/ec2/docker-compose.yml up -d
```
Cuối cùng, đặt biến cho workflow giữ Supabase hoạt động: GitHub → *Settings → Secrets and variables → Actions → Variables* → `KEEPALIVE_URL = https://<API_DOMAIN>/api`.

---

## 5. Vận hành hằng ngày

| Việc | Lệnh (trong `~/base-sale-shop`) |
|---|---|
| Xem log backend | `docker compose -f deploy/ec2/docker-compose.yml logs -f api` |
| Xem log Caddy/HTTPS | `docker compose -f deploy/ec2/docker-compose.yml logs -f caddy` |
| Khởi động lại | `docker compose -f deploy/ec2/docker-compose.yml restart api` |
| Cập nhật tay | `git pull && docker compose -f deploy/ec2/docker-compose.yml up -d --build` |
| Quay về bản trước | `git reset --hard <commit-cũ> && docker compose -f deploy/ec2/docker-compose.yml up -d --build` |
| Dọn image cũ | `docker image prune -f` |

## 6. Dừng hẳn để không mất phí
EC2 → *Instances* → chọn máy → **Terminate**; *Elastic IPs* → **Release**; Amplify → *App settings → General → Delete app*.

## 7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| Build trên EC2 bị dừng giữa chừng (`Killed`) | Thiếu RAM: kiểm tra swap (`free -h`, bước 1.4) hoặc dùng `t3.small` |
| Caddy báo lỗi xin chứng chỉ | DNS chưa trỏ đúng Elastic IP hoặc security group chưa mở cổng 80/443 |
| Trình duyệt báo lỗi CORS | `CORS_ORIGINS` chưa có domain frontend (không có `/` ở cuối), nhớ `up -d` lại |
| Mọi API trả 500, `/api/health` vẫn 200 | Supabase bị tạm dừng: vào dashboard Supabase bấm **Restore**; workflow keep-alive giúp tránh việc này |
| Frontend vẫn gọi API cũ | Đổi `NEXT_PUBLIC_API_URL` xong phải **Redeploy** trên Amplify |
| Chatbot báo "quá tải" | Hết hạn mức gói miễn phí Gemini, đợi khoảng 1 phút |
