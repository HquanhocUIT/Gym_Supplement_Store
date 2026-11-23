# Task 47 — Store và kiểm tra chéo Gym

Ngày kiểm tra 23/11/2026. Phiên bản nền là main sau PR #283.

Chạy trên PostgreSQL 18 riêng tại localhost, dùng hai schema và hai seed trong repo. Backend chạy với database test, frontend chạy qua Vite. Các thao tác trên giao diện được thực hiện bằng Chrome headless qua Playwright, gọi Express và PostgreSQL thật. Bảng dưới cũng dùng làm hướng dẫn chạy lại thủ công.

## Chuẩn bị

1. Tạo database test rỗng, chạy lần lượt schema Auth/Gym, schema Store, seed Auth/Gym, seed Store.
2. Chạy backend trỏ tới database test và frontend trỏ tới API này.
3. Dùng tài khoản admin và member trong seed. Khi kiểm tra gói còn hạn, đặt ngày bắt đầu và kết thúc bao quanh ngày hiện tại.
4. Ghi lại stock, số đơn và số món trong giỏ trước ca checkout. Sau lỗi, truy vấn lại các bảng để đối chiếu.

## Mười ca nghiệp vụ

| ID | Thao tác | Kết quả mong đợi | Kết quả chạy |
|---|---|---|---|
| ST01 | Vào /shop, tìm whey, tìm chuỗi không tồn tại rồi xóa bộ lọc | Có 5 sản phẩm whey, trạng thái rỗng có đường quay lại danh sách | Đạt |
| ST02 | Đặt stock một variant về 0 trong database test, mở trang chi tiết | Hiện Hết hàng, khóa nút thêm giỏ; trả stock về giá trị cũ sau ca | Đạt |
| ST03 | Đăng nhập member, thêm món, tăng số lượng; xóa món | Giỏ và badge cùng cập nhật, tổng tiền đổi theo số lượng; xóa món cuối có trạng thái rỗng | Đạt; tăng và badge chạy qua trình duyệt/API thật, xóa được kiểm tra trong regression test frontend |
| ST04 | Thêm 2 món khi kho đủ, giảm stock xuống 1 bằng kết nối test, checkout | HTTP 409 INSUFFICIENT_STOCK; số đơn và stock giữ nguyên, giỏ còn món | Đạt, đối chiếu PostgreSQL trước/sau |
| ST05 | Member có membership active và còn hạn đặt 2 món qua /checkout | Đơn COD pending; giảm đúng 10%; trừ kho 2; giỏ rỗng; hiện xác nhận | Đạt, đối chiếu PostgreSQL và trình duyệt |
| ST06 | Chuyển membership sang expired, thêm món và checkout | Giảm giá bằng 0, tổng bằng subtotal | Đạt, đối chiếu API thật |
| ST07 | Admin hủy đơn pending đã tạo, kiểm tra stock; thử hủy lại | Kho hoàn một lần, gọi lại không cộng kho tiếp | Chưa đạt; request đổi trạng thái trả 404, theo issue #284 |
| ST08 | Admin đổi pending → confirmed → shipping → delivered; thử chuyển ngược | Lưu trạng thái hợp lệ; chuyển sai bị từ chối | Chưa đạt; API quản lý trạng thái chưa có trên main, theo issue #284 |
| GY09 | Đăng ký tài khoản mới, admin gán plan active bằng /api/members/:id/memberships | Register 201, membership 201 với ngày kết thúc theo duration_days | Đạt, API thật |
| GY10 | Admin check-in member vừa được gán gói, rồi thử member expired | Gói còn hạn trả 201; hết hạn trả 400 MEMBERSHIP_EXPIRED | Đạt, API thật |

8 ca đạt, 2 ca chưa đạt do thiếu API quản lý trạng thái. Theo dõi ST07–ST08 tại [issue #284](https://github.com/LingSeanCoder/Gym-Supplement-Store/issues/284). Chạy lại hai ca sau khi tích hợp Task 39.

## Task 49 — Giao diện Store

- Chrome ở 375, 768, 1024, 1280 và 1440 px, các trang shop, chi tiết, cart, checkout, 403 và 404 có chiều rộng tài liệu không vượt viewport. Giỏ và checkout có dữ liệu; tên sản phẩm dài không có dấu cách cũng được kiểm tra.
- Shop có skeleton, báo lỗi và tải lại; lỗi danh mục vẫn cho phép xem sản phẩm. Kết quả rỗng có nút xóa bộ lọc.
- Lỗi ảnh được tái hiện bằng phản hồi dữ liệu kiểm thử và ảnh 404. Trang dùng biểu tượng thay thế có nhãn đọc màn hình. Ảnh danh sách dùng lazy loading, favicon trả 200.
- Cart và checkout có skeleton. Checkout chặn giỏ thiếu tồn kho, giữ thông tin giao hàng khi request lỗi, khóa nút khi đang gửi.
- Checkout dùng tổng chính thức do POST trả về. Xác nhận hiển thị ngay trên trang và nhận focus. Lịch sử đơn còn chờ API tương ứng.
- 404 sản phẩm được phân biệt với lỗi mạng; trang 404 có link về /shop. Trang 403 có nút quay lại và vùng bấm đủ lớn.

## Regression

66 backend test đạt trên PostgreSQL test, gồm transaction checkout và API Gym. 24 frontend test đạt, gồm bốn test checkout mới. Production build đạt; còn cảnh báo bundle JavaScript lớn.

Các ca lỗi mạng, skeleton và ảnh hỏng dùng chặn phản hồi trong trình duyệt. Các ca checkout và Gym dùng database thật. Chưa xác minh lại trên domain production sau khi PR này được triển khai.

## Lỗi đã sửa trong PR chung

- Bộ lọc shop yêu cầu tổng chiều rộng cột vượt vùng nội dung ở tablet.
- Cột grid trang chi tiết bị kéo rộng theo tên sản phẩm không có dấu cách.
- Seed Gym cần ép kiểu date và timestamptz khi INSERT từ VALUES.
- Router /staff/check-in hiển thị placeholder dù component check-in đã có.
- Checkout chưa được router sử dụng; chuyển hướng sau mua trỏ tới API lịch sử chưa tích hợp.
- Tạm tính checkout trừ 10% cho mọi tài khoản. Giảm giá cuối cùng hiện lấy từ backend.
