# API Documentation - Auth, Gym and Store

> Base URL local: `http://localhost:5000`. Swagger UI: `/docs/`. OpenAPI JSON: `/openapi.json`.
> Đặc tả chính: `backend/src/docs/openapi.yaml`. Bảng dưới phản ánh các route đang được mount trong nhánh hiện tại.

## Xác thực và cách thử

Gọi `POST /api/auth/login`, lấy `data.access_token`, bấm **Authorize** trong Swagger rồi dán riêng chuỗi token. Backend kiểm tra role trong JWT. Đăng ký công khai luôn tạo `member`.

Public không cần token. Authenticated là mọi tài khoản đăng nhập. Các quyền Admin hoặc Admin / Staff được kiểm tra ở middleware của từng route.

Response dùng `{ success, data, error }`. Giá trị PostgreSQL numeric thường được trả dưới dạng chuỗi; đơn vị tiền là VND. Chỉ nhập mật khẩu và token trên máy khi thử, không lưu vào đặc tả hoặc collection chia sẻ.

## Health

Kiểm tra ứng dụng và database.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/health` | Public | — | Healthy |
| GET | `/api/health` | Public | — | Healthy |
| GET | `/health/db` | Public | — | DatabaseHealthy |
| GET | `/api/health/db` | Public | — | DatabaseHealthy |

## Auth

Đăng ký bằng email/mật khẩu hoặc Google Identity Services; tài khoản đăng ký công khai có role `member`. Đăng nhập email/mật khẩu hỗ trợ các tài khoản nhân viên và admin.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | RegisterInput | AuthData |
| POST | `/api/auth/login` | Public | LoginInput | AuthData |
| POST | `/api/auth/google` | Public | GoogleLoginInput (`credential`) | AuthData |

`credential` phải là Google ID token hợp lệ dành cho đúng OAuth client của ứng dụng. Backend xác minh chữ ký, audience và email đã xác thực trước khi cấp JWT của ứng dụng. Trên Render cần cấu hình `GOOGLE_CLIENT_ID`; nếu thiếu, endpoint trả `503 GOOGLE_AUTH_NOT_CONFIGURED`.

## Plans

Xem gói tập công khai; quản lý gói tập dành cho Admin.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/api/plans` | Public | — | Plan[] |
| POST | `/api/plans` | Admin | PlanInput | Plan |
| GET | `/api/plans/{id}` | Public | — | Plan |
| PUT | `/api/plans/{id}` | Admin | PlanUpdateInput | Plan |
| DELETE | `/api/plans/{id}` | Admin | — | PlanHidden |

## Members

Quản lý hội viên dành cho Admin và Staff.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/api/members` | Admin / Staff | `search`, `page`, `limit` | MemberList |
| GET | `/api/members/{id}` | Admin / Staff | — | MemberDetail |
| POST | `/api/members/{id}/memberships` | Admin / Staff | MembershipInput | MembershipCreated |

## Checkins

Check-in và danh sách hôm nay dành cho Admin và Staff.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| POST | `/api/checkins` | Admin / Staff | CheckinInput | Checkin |
| GET | `/api/checkins/today` | Admin / Staff | — | TodayCheckin[] |

## Me

Dữ liệu của chính tài khoản đăng nhập.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/api/me/profile` | Authenticated | — | User |
| GET | `/api/me/memberships` | Authenticated | — | MyMembership[] |
| GET | `/api/me/checkins` | Authenticated | — | MyCheckin[] |

## Categories

Danh mục sản phẩm; thao tác ghi dành cho Admin.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/api/store/categories` | Public | — | Category[] |
| POST | `/api/store/categories` | Admin | CategoryInput | Category |
| PUT | `/api/store/categories/{id}` | Admin | CategoryInput | Category |
| DELETE | `/api/store/categories/{id}` | Admin | — | Category |

## Products

Sản phẩm, variant, upload ảnh; thao tác ghi dành cho Admin.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/api/store/products` | Public | `q`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` | ProductList |
| POST | `/api/store/products` | Admin | ProductInput | Product |
| GET | `/api/store/products/{productId}` | Public | — | ProductDetail |
| PUT | `/api/store/products/{productId}` | Admin | ProductInput | Product |
| DELETE | `/api/store/products/{productId}` | Admin | — | Product |
| GET | `/api/store/products/{productId}/variants` | Public | — | Variant[] |
| POST | `/api/store/products/{productId}/variants` | Admin | VariantInput | Variant |
| PUT | `/api/store/products/{productId}/variants/{variantId}` | Admin | VariantInput | Variant |
| DELETE | `/api/store/products/{productId}/variants/{variantId}` | Admin | — | Variant |
| POST | `/api/store/products/{productId}/image` | Admin | multipart/form-data: image | Product |

## Cart

Giỏ hàng của chính tài khoản đăng nhập.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| GET | `/api/store/cart` | Authenticated | — | Cart |
| POST | `/api/store/cart/items` | Authenticated | CartItemInput | CartItem |
| PUT | `/api/store/cart/items/{itemId}` | Authenticated | QuantityInput | CartItem |
| DELETE | `/api/store/cart/items/{itemId}` | Authenticated | — | DeletedCartItem |

## Orders

Checkout COD từ giỏ hàng hiện tại.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| POST | `/api/store/orders` | Authenticated | CheckoutInput | CheckoutData |
| GET | `/api/store/orders` | Authenticated, own orders | `page`, `limit` (1–100) | `{ items, pagination }` |
| GET | `/api/store/orders/{orderId}` | Authenticated, own order | Positive integer ID | OwnOrderDetail |

Lịch sử và chi tiết đơn luôn dùng `user_id` từ JWT. Truyền `user_id` khác trong query không đổi chủ tài khoản. Đơn không tồn tại và đơn của người khác cùng trả 404; endpoint khách hàng không cho Admin đọc đơn của tài khoản khác. Danh sách sắp theo ngày tạo mới nhất và ID để phân trang ổn định.

### API để giải thích khi demo: checkout COD

`POST /api/store/orders` nhận thông tin giao hàng và JWT; sản phẩm được lấy từ giỏ hàng của chính tài khoản, không truyền giá hay `user_id` trong request. Ví dụ body:

```json
{
  "recipient_name": "Nguyen Van A",
  "recipient_phone": "0900000000",
  "shipping_address": "12 Nguyen Hue, Quan 1",
  "payment_method": "cod"
}
```

Luồng xử lý: middleware xác thực JWT → service kiểm tra dữ liệu giao hàng và phương thức COD → repository mở transaction, khóa giỏ/variant và kiểm tra tồn kho → server tính tổng tiền (giảm 10% nếu hội viên có gói còn hiệu lực) → tạo đơn, snapshot mặt hàng và payment pending, trừ tồn kho rồi xóa giỏ → commit. Nếu giỏ rỗng hoặc thiếu hàng, API trả `409` và rollback để không tạo đơn dở dang. Thành công trả `201` với `data.order` và `data.payment`.

Sau khi đơn đã commit, backend gửi sự kiện `order.created` tới n8n nếu `N8N_ORDER_CREATED_WEBHOOK_URL` được cấu hình. Lỗi webhook không hủy đơn đã tạo. Đây là API ghi dữ liệu thật: khi demo hãy dùng tài khoản và giỏ hàng thử vì tồn kho sẽ giảm, giỏ sẽ được xóa và workflow có thể gửi email.

## Dashboard

| Method | URL | Quyền | Response data |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin / Staff | AdminStats |

Trả doanh thu hôm nay/tháng của Gym và Store, số hội viên active, gói sắp hết hạn trong 7 ngày, top 5 sản phẩm và variant tồn kho <= 5. Chi tiết quy tắc tính nằm trong Swagger.

## Quy tắc cần chú ý

- Tên trường, schema request/response, tham số path/query và mã HTTP chi tiết nằm trong OpenAPI; Swagger hiển thị trực tiếp từ file này.
- ID hội viên khác ID membership; ID món giỏ hàng khác ID variant. Lấy ID thật từ API danh sách tương ứng.
- Upload chỉ nhận trường `image`, JPEG/PNG/WebP, tối đa 5 MB. Không cần đưa Supabase secret vào request.
- Khách hàng có API xem lịch sử/chi tiết đơn của chính mình. API quản trị đơn hàng riêng chưa được mount; `/api/admin/stats` chỉ cung cấp số liệu tổng quan.

## Mở API docs trên Render

Render Blueprint ở `render.yaml` chạy backend Docker và kiểm tra sức khỏe qua `/health`. Swagger và OpenAPI JSON được phục vụ trực tiếp bởi cùng backend, không cần tạo static site riêng. Trong Render Dashboard, mở web service `gym-store-api`, lấy hostname hiển thị ở đầu trang rồi thay `<render-service>` bằng phần hostname đó:

- Swagger UI: `https://<render-service>.onrender.com/docs/`
- Đặc tả JSON để tải hoặc import Postman: `https://<render-service>.onrender.com/openapi.json`
- Health check: `https://<render-service>.onrender.com/health`

Service cần kết nối database để khởi động; cấu hình `DATABASE_URL` trong Render. Blueprint bật SSL và đặt `JWT_SECRET` được sinh tự động. Đặt `CORS_ORIGIN` thành domain frontend nếu frontend gọi API từ trình duyệt. Nếu demo đăng nhập Google, thêm `GOOGLE_CLIENT_ID`; nếu demo email xác nhận đơn, thêm `N8N_ORDER_CREATED_WEBHOOK_URL`. Trang `/docs/` và `/openapi.json` công khai; các endpoint có `bearerAuth` vẫn cần JWT hợp lệ.

## Postman

Collection v2.1 gồm 42 request nằm tại `docs/postman/gym-supplement-store.postman_collection.json`, khớp với các operation hiện có trong OpenAPI. Bản chia sẻ dùng `baseUrl = http://localhost:5000`; `accessToken`, `password`, `googleIdToken` và `orderId` để trống. Xem `docs/postman/README.md` để cấu hình trên máy cá nhân. Có thể import `/openapi.json` trên Render hoặc `backend/src/docs/openapi.yaml` vào Postman để tạo lại collection.
