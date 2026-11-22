# Chẩn đoán kết nối Supabase trên Render

`/health` kiểm tra tiến trình backend; `/api/health/db` truy vấn database. Backend có thể trả 200 ở `/health` trong khi database đang lỗi.

Gọi `/api/health/db`, sau đó xem Render service → Logs và tìm dòng `[database-health]`. HTTP response công khai vẫn chỉ trả `DATABASE_UNAVAILABLE`. Log nội bộ chỉ chứa một mã đã lọc, không chứa URL, mật khẩu, message hoặc stack của lỗi gốc.

| Mã log | Kiểm tra |
|---|---|
| `28P01`, `28000` | Username, mật khẩu database, mã hóa ký tự đặc biệt trong URI |
| `POOLER_TENANT_NOT_FOUND` | Copy đúng host và username của Session pooler, gồm project reference |
| `ENOTFOUND`, `EAI_AGAIN` | Host và DNS |
| `ENETUNREACH`, `EHOSTUNREACH` | Dùng Session pooler IPv4 thay vì direct endpoint IPv6 |
| `ECONNREFUSED`, `ECONNRESET` | Trạng thái Supabase, host, port và giới hạn mạng |
| `ETIMEDOUT`, `CONNECTION_TIMEOUT` | Supabase bị pause, giới hạn IP hoặc đường truyền từ Render |
| `SELF_SIGNED_CERT_IN_CHAIN`, `DEPTH_ZERO_SELF_SIGNED_CERT`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` | CA đúng project Supabase và `DATABASE_SSL_CA_PATH` |
| `ERR_TLS_CERT_ALTNAME_INVALID`, `CERT_HAS_EXPIRED` | Host trong URI, đúng chứng chỉ CA và thời hạn chứng chỉ |
| `3D000` | Tên database |
| `53300`, `57P03` | Giới hạn kết nối hoặc database chưa sẵn sàng |
| `UNKNOWN_DATABASE_ERROR` | Cần chẩn đoán thêm; không công khai lỗi gốc chứa credential |

## Chứng chỉ trên Render

Docker tải Supabase Root 2021 CA từ Supabase khi build, kiểm tra SHA-256 và đặt file tại `/app/supabase-root.crt`. Blueprint đặt `DATABASE_SSL=true` và `DATABASE_SSL_CA_PATH=/app/supabase-root.crt`. Khi Supabase đổi CA, xác minh chứng chỉ mới từ Database Settings rồi cập nhật URL và SHA-256 trong Dockerfile.

Nếu service đang chạy bản cũ, đồng bộ nhánh `main` mà Blueprint theo dõi rồi kiểm tra bản deploy mới đã Live. Trong Environment, kiểm tra `DATABASE_SSL_CA_PATH` khớp đường dẫn trong image. Gọi `/api/health/db` để xác nhận HTTP 200 và `database: "connected"`.

URI Session pooler không có tham số SSL vì code quản lý SSL bằng các biến riêng. Không đưa `.env`, URI có mật khẩu hoặc file chứng chỉ vào PR.
