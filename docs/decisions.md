# Quyết định thiết kế database

## ERD v1 — đề xuất, chưa chốt

- Trạng thái: chờ Quân và Sang cùng xem và xác nhận.
- Nguồn thiết kế: `docs/erd/erd-v1.dbml`. Sơ đồ đề xuất Task 13 nằm trong
  `docs/erd/erd-task13.png` và `docs/erd/erd-task13.svg`; ảnh `erd-v1.png` là
  bản Task 12 cũ. Nếu thay đổi DBML sau khi duyệt, cần cập nhật lại sơ đồ.
- Chưa tạo hoặc áp dụng SQL. Task 14 và 15 chỉ bắt đầu viết SQL sau khi cả hai
  đồng ý ERD; các thay đổi về sau đi qua migration và PR theo plan.

### Phạm vi đề xuất

- Giữ 12 bảng và quan hệ Auth, Gym, Store, Payments của Task 12. Tên bảng và cột
  dùng `snake_case`; khóa chính và khóa ngoại dùng `int`. Các khóa ngoại bắt buộc
  được đánh dấu `not null`; hai khóa thanh toán có thể rỗng theo quy tắc bên dưới.
- Mỗi bảng có `created_at` và `updated_at` kiểu `timestamptz`, mặc định `now()`.
  Khi cập nhật bản ghi, backend hoặc trigger phải cập nhật `updated_at`; giá trị
  mặc định một mình không tự cập nhật. Thời điểm check-in vẫn có `checkin_time`.
- Giá và số tiền dùng `decimal(12,2)`, thống nhất đơn vị VND. Hai bạn cần xác
  nhận độ lớn và cách làm tròn trước khi viết SQL.
- Sản phẩm có một `image_url` cho ảnh trên Supabase Storage; flavor có thể trống
  cho phụ kiện. Nếu cần nhiều ảnh, thay đổi thiết kế qua PR sau khi thống nhất.
- Giỏ hàng là một giỏ cho mỗi user; một variant chỉ xuất hiện một lần trong mỗi
  giỏ. Đơn hàng lưu tên, số điện thoại, địa chỉ người nhận tại lúc checkout.
- Đơn hàng lưu `subtotal`, `discount_amount` và `total_amount` để hiển thị giảm
  giá hội viên 10%. Các mục đơn lưu tên sản phẩm, mô tả variant, đơn giá và số
  lượng tại lúc mua để thông tin cũ không đổi khi sản phẩm được sửa.
- Giá trị role, status và phương thức thanh toán dùng chữ thường như ghi trong
  DBML; giao diện có thể hiển thị nhãn tiếng Việt hoặc chữ hoa khác.

### Ràng buộc cần thực hiện trong SQL và backend

DBML thể hiện khóa, null và unique; các quy tắc dưới đây cần được thực hiện và
kiểm tra trong Task 14–15 hoặc backend liên quan:

- `membership_plans.duration_days > 0`, `memberships.end_date >= start_date`.
- Giá và số tiền không âm; tồn kho `stock >= 0`; số lượng giỏ và đơn `> 0`.
- `discount_amount <= subtotal` và `total_amount = subtotal - discount_amount`.
  Tổng phụ phải bằng tổng đơn giá nhân số lượng các mục; backend tính và kiểm
  tra trong transaction khi tạo đơn. Quy tắc giảm 10% và làm tròn cần thống nhất.
- Mỗi payment gắn **chính xác một** trong `order_id` và `membership_id` bằng
  CHECK; backend phải kiểm tra `payments.user_id` trùng chủ đơn hoặc hội viên.
- Các giá trị role, status, payment_method phải nằm trong danh sách ở DBML.
- Dùng khóa ngoại và chính sách xóa phù hợp để không xóa mất lịch sử đơn hàng,
  hội viên và thanh toán. Cần hai bạn xác nhận chính sách xóa cụ thể trước SQL.
- Checkout và hoàn kho phải chạy transaction; kiểm tra tồn kho khi giữ khóa
  variant. COD có thể ở `pending` khi tạo đơn và chuyển `completed` khi đã thu.

### Điểm cần Quân và Sang xác nhận

1. Địa chỉ giao hàng dạng một trường văn bản và lưu một ảnh cho mỗi sản phẩm.
2. Số tiền VND `decimal(12,2)` và cách làm tròn giảm giá 10%.
3. Tên các trạng thái viết thường; cách cập nhật `updated_at` và chính sách xóa.
4. Quy tắc payment gắn đúng một đơn hoặc một membership; trạng thái COD.
5. Phạm vi phần Gym, đặc biệt các trường membership và check-in do Sang phụ trách.

Sau khi cả hai đồng ý, cập nhật trạng thái tại đây và cập nhật hình nếu DBML thay đổi.
