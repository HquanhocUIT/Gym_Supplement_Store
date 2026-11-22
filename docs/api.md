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

Đăng ký và đăng nhập; đăng ký luôn tạo role member.

| Method | URL | Quyền | Body / query | Response data |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | RegisterInput | AuthData |
| POST | `/api/auth/login` | Public | LoginInput | AuthData |

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

## Quy tắc cần chú ý

- Tên trường, schema request/response, tham số path/query và mã HTTP chi tiết nằm trong OpenAPI; Swagger hiển thị trực tiếp từ file này.
- ID hội viên khác ID membership; ID món giỏ hàng khác ID variant. Lấy ID thật từ API danh sách tương ứng.
- Upload chỉ nhận trường `image`, JPEG/PNG/WebP, tối đa 5 MB. Không cần đưa Supabase secret vào request.
- Checkout là thao tác ghi thật: tạo đơn, trừ kho, tạo payment pending và dọn giỏ. Hội viên đủ điều kiện nhận giảm 10%.
- Các route Dashboard, lịch sử đơn và quản lý đơn chưa được mount trên nhánh này nên chưa được mô tả là API hoạt động. Cập nhật tài liệu khi các PR tương ứng được merge.

## Postman

Collection v2.1 gồm 38 request nằm tại `docs/postman/gym-supplement-store.postman_collection.json`. Bản chia sẻ dùng `baseUrl = http://localhost:5000`, các biến `accessToken` và `password` để trống. Xem `docs/postman/README.md` để cấu hình trên máy cá nhân. Khi cần tạo lại collection, import `/openapi.json` hoặc `backend/src/docs/openapi.yaml` vào Postman rồi xuất và kiểm tra các biến trước khi commit.
