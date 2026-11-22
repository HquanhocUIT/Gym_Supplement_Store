# Postman collection

Import `gym-supplement-store.postman_collection.json` vào Postman. File dùng định dạng Collection v2.1 và chứa 38 request theo đặc tả `backend/src/docs/openapi.yaml`.

## Cấu hình trên máy của bạn

1. Chạy backend bằng `npm run dev` trong thư mục `backend`.
2. Đặt `baseUrl` thành `http://localhost:5000` hoặc địa chỉ backend đã deploy, không thêm `/api` vì đường dẫn request đã có tiền tố này.
3. Với request đăng nhập, nhập email của tài khoản và đặt biến `password` trên máy của bạn.
4. Gọi đăng nhập rồi lấy `data.access_token`, đặt vào biến `accessToken`. Chỉ dán token, không thêm chữ `Bearer`.
5. Thử request công khai như `GET /api/health`, sau đó thử request cần quyền như `GET /api/members`.

`accessToken` và `password` trong bản chia sẻ được để trống. Khi xuất lại collection để commit, xóa giá trị thật của hai biến này và kiểm tra cả body, header, saved examples. Không xuất environment cá nhân.

Các request tạo, sửa, xóa, đăng ký gói, check-in và checkout có thể ghi dữ liệu. Không dùng Run toàn bộ collection để chỉ kiểm tra kết nối; chọn từng request cần thử. ID trong các request cần lấy từ dữ liệu của database đang dùng.
