# Postman collection

Import `gym-supplement-store.postman_collection.json` vào Postman. File dùng định dạng Collection v2.1 và chứa 42 request, bao phủ các operation trong `backend/src/docs/openapi.yaml`.

## Cấu hình trên máy của bạn

1. Chạy backend bằng `npm run dev` trong thư mục `backend`.
2. Đặt `baseUrl` thành `http://localhost:5000` hoặc hostname backend Render, không thêm `/api` vì đường dẫn request đã có tiền tố này. Swagger UI trên Render nằm ở `/docs/`; OpenAPI JSON nằm ở `/openapi.json`.
3. Với request đăng nhập, nhập email của tài khoản và đặt biến `password` trên máy của bạn.
4. Gọi đăng nhập rồi lấy `data.access_token`, đặt vào biến `accessToken`. Chỉ dán token, không thêm chữ `Bearer`.
5. Thử request công khai như `GET /api/health`, sau đó thử request cần quyền như `GET /api/members`.

Đăng nhập Google cần một Google Identity Services ID token hợp lệ; đặt token tạm thời vào `googleIdToken`. Đây là token đăng nhập của Google, khác `accessToken` do backend cấp. Request lịch sử đơn cần `accessToken`; request chi tiết cần thêm ID thật từ kết quả checkout hoặc danh sách đơn vào `orderId`.

`accessToken`, `password`, `googleIdToken` và `orderId` trong bản chia sẻ được để trống. Khi xuất lại collection để commit, xóa giá trị thật của các biến nhạy cảm và kiểm tra cả body, header, saved examples. Không xuất environment cá nhân.

Các request tạo, sửa, xóa, đăng ký gói, check-in và checkout có thể ghi dữ liệu. Không dùng Run toàn bộ collection để chỉ kiểm tra kết nối; chọn từng request cần thử. ID trong các request cần lấy từ dữ liệu của database đang dùng.
