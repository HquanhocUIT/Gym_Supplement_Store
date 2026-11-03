# Gym and Supplement Store Management System

**Group 28** — MSIS207.R11.CTTT

## Thành viên
| Vai trò | Họ tên | MSSV | Module |
|---|---|---|---|
| Người 1 | Nguyễn Đình Sang | [24521521] | Auth + Gym |
| Người 2 | Nguyễn Phan Hoàng Quân | [24521446] | Store |

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + `pg` (node-postgres), SQL có tham số
- **Database:** PostgreSQL local hoặc PostgreSQL trên Supabase
- **Database client:** pgAdmin để quản lý PostgreSQL và chạy SQL
- **Deploy:** Vercel (FE), Render (BE)
- **Container:** Docker

## Cấu trúc thư mục

```text
frontend/   React + Vite client
backend/    Express API using pg and PostgreSQL
database/   SQL schema, seed và migrations theo các task database
docs/       ERD and project documentation
.github/    Issue and pull request templates
```

## Chạy backend (Task 3)

Yêu cầu Node.js 22 trở lên. Từ thư mục dự án:

```powershell
cd backend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Nếu đã có `backend/.env`, giữ file hiện tại và bổ sung các biến còn thiếu từ
`.env.example`. Backend ưu tiên biến môi trường của tiến trình, sau đó
`backend/.env`, cuối cùng `.env` ở thư mục gốc để tương thích cấu hình cũ.
File cấu hình được tìm theo vị trí mã nguồn, không phụ thuộc thư mục chạy lệnh.

Kiểm tra API bằng trình duyệt hoặc PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/api/health
```

Cả hai URL trả HTTP 200 với dạng:

```json
{
  "success": true,
  "data": { "status": "ok", "timestamp": "...", "uptime": 0 },
  "error": null
}
```

Health endpoint chỉ kiểm tra API còn chạy, nên không yêu cầu database đã được
tạo hay kết nối thành công. Dùng `/health/db` hoặc `/api/health/db` để kiểm tra
database thật theo hướng dẫn Task 7 bên dưới.

### PostgreSQL local và pgAdmin

1. Khởi động PostgreSQL. Trong pgAdmin, kết nối server local qua host `localhost`,
   port `5432`, tài khoản PostgreSQL của bạn (thường là `postgres`).
2. Tạo database `gym_supplement_store` nếu chưa có, rồi đặt `PGHOST`, `PGPORT`,
   `PGDATABASE`, `PGUSER`, `PGPASSWORD` tương ứng trong `backend/.env`.
3. Để `DATABASE_URL` trống khi dùng các biến `PG*`. Nếu có `DATABASE_URL`, Pool
   sẽ ưu tiên URL đó. Không commit thông tin kết nối thật.

Backend dùng `pg` để truy cập PostgreSQL; pgAdmin là công cụ quản lý database.
Task 3 chưa tạo bảng hoặc seed; hai phần đó thực hiện ở Task 14–15 sau khi chốt ERD.

### Cấu trúc backend

```text
src/index.js        Start HTTP server and close the Pool on shutdown
src/app.js          Express middleware and route registration
src/config/         Environment configuration and shared pg Pool
src/routes/         URLs and HTTP methods
src/controllers/    HTTP requests and responses
src/services/       Business rules
src/repositories/   Parameterized SQL and database access
src/middlewares/    Shared error handling
```

Các API dùng dạng `{ success, data, error }`; route không tồn tại trả JSON 404,
JSON không hợp lệ trả 400, lỗi nội bộ trả thông báo chung.
`CORS_ORIGIN` mặc định là `http://localhost:5173`.

`npm run dev` dùng chế độ watch có sẵn của Node.js. Chạy production bằng `npm start`.
Chạy kiểm tra backend từ thư mục `backend/`:

```powershell
npm test
```

Tài liệu `pg`: [kết nối](https://node-postgres.com/features/connecting),
[truy vấn có tham số](https://node-postgres.com/features/queries),
[connection pool](https://node-postgres.com/features/pooling).
Đặc tả health endpoints nằm trong `openapi.yaml`; Swagger UI thuộc Task 43.

## Task 8: chạy API và PostgreSQL local bằng Docker

Yêu cầu Docker Desktop đang chạy. Từ thư mục gốc của dự án, bảo đảm `.env` có
`PGUSER`, `PGDATABASE` và `PGPASSWORD`. Nếu chưa có `.env`, copy từ `.env.example`
và tự điền `PGPASSWORD`; không commit file `.env`.

```powershell
docker compose up --build -d
docker compose ps
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/api/health/db
```

Compose chạy hai service:

- `api`: backend Express, mặc định tại `http://localhost:5000`.
- `db`: PostgreSQL 18 local trong container, mở `localhost:5433` cho pgAdmin;
  trong mạng Docker, API kết nối `db:5432`.

Compose dùng `PGUSER`, `PGDATABASE` và `PGPASSWORD` từ `.env` gốc cho database
Docker. Nó đặt riêng `DATABASE_URL` rỗng và `DATABASE_SSL=false` cho API trong
container, nên không dùng connection string Supabase trong `.env`. Backend chạy
trực tiếp bằng `npm run dev` vẫn dùng cấu hình `.env` như Task 7.

Nếu cổng đang bận, đặt `DOCKER_API_PORT` hoặc `DOCKER_DB_PORT` trong `.env`, rồi
chạy lại Compose. Ví dụ `DOCKER_API_PORT=5001` thì truy cập
`http://localhost:5001/api/health/db`. Các cổng này chỉ mở trên máy local.

Để kết nối pgAdmin tới database Docker, đăng ký server mới với host `localhost`,
port `5433` (hoặc `DOCKER_DB_PORT`), maintenance database là giá trị `PGDATABASE`,
username là `PGUSER` và password là `PGPASSWORD` trong `.env` gốc. Đây là database
Docker riêng, không phải database local cài trên máy hay Supabase.

```powershell
docker compose logs -f api
docker compose down
```

`docker compose down` dừng và xóa container/network nhưng giữ volume `postgres_data`.
PostgreSQL chỉ chạy các file SQL trong `database/schema/` lúc volume được khởi tạo
lần đầu. Hiện thư mục chưa có schema vì Task 14–15 chưa thực hiện; thêm SQL sau đó
không tự áp dụng vào volume đã tồn tại. Đổi `PGPASSWORD`, `PGUSER` hay `PGDATABASE`
trong `.env` cũng không tự cập nhật database đã khởi tạo.

## Task 7: kết nối Supabase bằng pg

Supabase là database riêng trên cloud. Đổi kết nối không tự chuyển bảng hay dữ
liệu từ PostgreSQL local lên Supabase; schema và seed vẫn thực hiện ở Task 14–15.

### Tạo project và lấy thông tin kết nối

1. Mở [Supabase Dashboard](https://supabase.com/dashboard), chọn **New project**,
   đặt tên project, chọn region và tự lưu mật khẩu database của project.
2. Khi project sẵn sàng, mở **Connect → Session pooler**, lấy URI và các tham số.
   Session pooler dùng port 5432 và phù hợp cho máy local/pgAdmin dùng IPv4.
3. Thay phần mật khẩu trong URI bằng mật khẩu database Supabase. Nếu mật khẩu có
   ký tự đặc biệt, URL-encode phần mật khẩu trước khi đặt vào URI.

Mật khẩu Supabase và mật khẩu PostgreSQL local có thể khác nhau. Điền trực tiếp
trên máy; không gửi URI có mật khẩu qua chat, issue hoặc PR.

### Cấu hình backend

Sửa file `.env` đang dùng: `backend/.env` được ưu tiên hơn `.env` ở thư mục gốc.
Giữ các biến khác và cập nhật ba biến sau:

```dotenv
# Tự dán URI Supabase đã điền mật khẩu vào đây trên máy.
DATABASE_URL=
DATABASE_SSL=true
DATABASE_SSL_CA_PATH=
```

- `DATABASE_URL` dùng URI từ Connect, không thêm `ssl`, `sslmode`, `sslcert`,
  `sslkey`, `sslrootcert` hoặc `sslnegotiation` vào URL. Cấu hình SSL nằm ở hai
  biến riêng để tránh URL ghi đè tùy chọn xác thực chứng chỉ của `pg`.
- `DATABASE_SSL=true` bật TLS và xác thực chứng chỉ server. Nếu cần CA riêng,
  tải chứng chỉ chính thức từ Database Settings, lưu trong `backend/certs/`,
  rồi đặt `DATABASE_SSL_CA_PATH=certs/ten-chung-chi.crt`. Đường dẫn tuyệt đối cũng
  được hỗ trợ. Thư mục này được Git bỏ qua; không tắt xác thực chứng chỉ để bỏ lỗi.
- Muốn quay lại local: để `DATABASE_URL` trống và `DATABASE_SSL=false`; Pool sẽ
  dùng lại các biến `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` đã có.

Khởi động lại backend sau khi thay `.env`:

```powershell
cd backend
npm run dev
```

Khi deploy Render ở task sau, đặt URI pooler và các biến SSL trong môi trường
của service. Session pooler phù hợp cho Express chạy lâu; nếu chọn Transaction
pooler thì dùng URI port 6543 từ Connect và không dùng prepared statement có
`name`. Các transaction luôn dùng cùng một client và release trong `finally`.

### Kết nối bằng pgAdmin

Trong pgAdmin, chuột phải **Servers → Register → Server** và đặt tên, ví dụ
`Gym Supabase`. Điền thông tin từ **Connect → Session pooler → View parameters**:

| Trường | Giá trị |
| --- | --- |
| Host name/address | Host Session pooler trong Dashboard |
| Port | `5432` |
| Maintenance database | `postgres` |
| Username | Username pooler trong Dashboard, thường có project ref sau `postgres.` |
| Password | Mật khẩu database của project Supabase |

Ở Parameters/SSL, chọn SSL mode `verify-full` và chọn Root certificate tải từ
Database Settings. Tên tab có thể khác giữa các phiên bản pgAdmin. Sau khi lưu,
mở Query Tool trên database `postgres` và chạy truy vấn chỉ đọc:

```sql
SELECT NOW() AS checked_at;
```

### Kiểm tra kết nối qua API

```powershell
Invoke-RestMethod http://localhost:5000/api/health/db
```

Thành công trả HTTP 200:

```json
{
  "success": true,
  "data": { "status": "ok", "database": "connected", "timestamp": "..." },
  "error": null
}
```

Nếu kết nối/truy vấn lỗi, API trả HTTP 503 với code `DATABASE_UNAVAILABLE`, không
đưa URL hay mật khẩu vào response. `/health` và `/api/health` vẫn chỉ kiểm tra
tiến trình API. Health database giới hạn chờ kết nối và truy vấn ở 5 giây mỗi bước;
không dùng kết quả local để kết luận đã kết nối Supabase.

Chạy `npm test` trong `backend/` để kiểm tra response và cấu hình SSL. Bộ test
không cần Supabase; việc xác nhận cloud thực tế cần project và URI thật trên máy.
Minh chứng do thành viên tự chụp khi thao tác pgAdmin và health API; không commit
file screenshot hoặc chụp nội dung `.env`.

Tài liệu chính thức: [kết nối Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres),
[pgAdmin với Supabase](https://supabase.com/docs/guides/database/pgadmin),
[SSL trong pg](https://node-postgres.com/features/ssl).

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Vite hiển thị ứng dụng tại `http://localhost:5173`. Các route mẫu:

- `/`: cửa hàng công khai
- `/admin`: dashboard quản trị
- `/admin/products`: danh sách sản phẩm mẫu
- `/member`: dashboard thành viên
