# Test Checklist — Module Gym & Cross-test Store

- **Task:** 46 — [QA] Viết test checklist cho module Gym và test chéo Store
- **Ngày thực hiện:** 22/11/2026
- **Người thực hiện:** ................................
- **Môi trường:** Local — Frontend `http://localhost:5173`, Backend `http://localhost:5000`, PostgreSQL/Supabase
- **Trình duyệt:** ................................

## 1. Điều kiện tiên quyết

- Đã chạy schema `database/schema/01_auth_gym.sql`, `02_store.sql`.
- Đã chạy seed `database/seed/01_gym_auth.sql`, `02_store.sql` (idempotent, có thể chạy lại để reset dữ liệu).
- Backend chạy bằng `npm start` trong `backend/`, frontend chạy bằng `npm run dev` trong `frontend/`.
- Swagger UI dùng để test API: `http://localhost:5000/docs`.
- Tài khoản test:

| Vai trò | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| Admin | `admin@gym.local` | `Admin@123456` | Toàn quyền quản trị |
| Staff | `staff@gym.local` | `Staff@123456` | Check-in, gia hạn |
| Member (Active) | `member@gym.local` | `Member@123456` | Gói `1 Month Pass` còn hạn |
| Member (Expired) | `david.pham@gmail.com` | `Member@123456` | Gói đã hết hạn |

> **Quy ước cột:** cột **Kết quả thực tế** và **Pass/Fail** để trống cho người test điền.
> Ghi `Pass` nếu kết quả trùng khớp, `Fail` nếu sai khác và ghi lại hiện tượng thực tế.

## 2. Test case module Auth + Gym

| STT | Chức năng | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Pass/Fail |
|---|---|---|---|---|---|
| 1 | Đăng nhập sai mật khẩu | 1. Mở `/login`.<br>2. Nhập `admin@gym.local` và mật khẩu sai (ví dụ `wrong-pass`).<br>3. Bấm **Login**. | Hệ thống không đăng nhập; hiển thị hộp lỗi màu đỏ với nội dung `Email or password is incorrect`; vẫn ở trang `/login`; `localStorage` không có `token`. |  |  |
| 2 | Member truy cập trang Admin `/admin/plans` | 1. Đăng nhập bằng `member@gym.local`.<br>2. Truy cập trực tiếp `http://localhost:5173/admin/plans`.<br>3. Thử lại khi chưa đăng nhập. | Khi đã đăng nhập bằng Member: bị chặn và chuyển tới `/403` (Forbidden), không thấy dữ liệu gói tập.<br>Khi chưa đăng nhập: chuyển tới `/login`. |  |  |
| 3 | Staff check-in cho hội viên có gói Active | 1. Đăng nhập `staff@gym.local`.<br>2. Mở `/staff/check-in`.<br>3. Nhập **User ID** của `member@gym.local` (xem ở `/admin/members` hoặc bảng `users`).<br>4. Bấm **Check-in**. | API `POST /api/checkins` trả `201`; hiển thị thông báo màu xanh `Check-in successful.`; bảng **Today's Check-ins** tăng thêm 1 dòng đúng `user_id` và thời gian hiện tại. |  |  |
| 4 | Staff check-in cho hội viên có gói Expired | 1. Đang ở `/staff/check-in` với tài khoản Staff.<br>2. Nhập **User ID** của `david.pham@gmail.com` (gói đã hết hạn).<br>3. Bấm **Check-in**. | API trả `400` với mã `MEMBERSHIP_EXPIRED`; giao diện hiển thị thông báo màu đỏ `Check-in failed.`; bảng Today's Check-ins không thêm dòng mới. |  |  |
| 5 | Admin thêm gói tập mới (thiếu tên / giá âm) | 1. Đăng nhập `admin@gym.local`, mở `/admin/plans`.<br>2. Bấm **Add Plan**, để trống **Plan Name**, nhập Duration `30`, Price `250000`, bấm **Create Plan**.<br>3. Mở lại modal, nhập Name `Test Plan`, Duration `30`, Price `-1000`, bấm **Create Plan**. | Trường hợp thiếu tên: trình duyệt chặn submit do `required`, không gửi request, không thêm gói.<br>Trường hợp giá âm: API trả lỗi (ràng buộc `price >= 0`), modal hiển thị thông báo lỗi màu đỏ, bảng không có gói mới. |  |  |
| 6 | Admin sửa giá gói tập | 1. Đăng nhập Admin, mở `/admin/plans`.<br>2. Bấm **Edit** ở gói `1 Month Pass`.<br>3. Đổi Price thành `300000`, bấm **Update Plan**.<br>4. Tải lại trang. | Modal đóng; bảng cập nhật giá `300.000 ₫`; sau khi tải lại giá vẫn là `300.000 ₫`; bản ghi trong `membership_plans` đã đổi `price`. |  |  |
| 7 | Admin xóa mềm gói tập (`is_active = false`) | 1. Đăng nhập Admin, mở `/admin/plans`.<br>2. Chọn một gói test, bấm **Delete** và xác nhận.<br>3. Kiểm tra bảng và trang `/pricing`.<br>4. Kiểm tra DB: `SELECT id, name, status FROM membership_plans WHERE id = <id>;` | Gói biến mất khỏi bảng quản trị và không còn hiển thị ở `/pricing`; bản ghi vẫn tồn tại trong DB với `status = 'hidden'` (tương đương `is_active = false`); `GET /api/plans` không trả gói này. |  |  |
| 8 | Staff gia hạn gói tập cho hội viên | 1. Đăng nhập `staff@gym.local`, mở `/staff/renew`.<br>2. Nhập **Member ID** của `member@gym.local`.<br>3. Chọn một gói trong danh sách, chọn **Start Date** là hôm nay.<br>4. Bấm **Confirm Renewal**. | API `POST /api/members/:id/memberships` thành công; hiển thị thông báo màu xanh `Membership renewed successfully.`; `end_date` = `start_date` + `duration_days`; member thấy gói mới ở `/member/dashboard`. |  |  |
| 9 | Member xem thông tin gói tập cá nhân | 1. Đăng nhập `member@gym.local`.<br>2. Mở `/member/dashboard`.<br>3. Đối chiếu dữ liệu với DB/bảng `memberships`. | Thẻ **Current Membership** hiển thị đúng tên gói, Start Date, Expiry Date, trạng thái `ACTIVE` màu xanh; **Check-in History** liệt kê lịch sử check-in của chính member; không hiển thị dữ liệu của người khác. |  |  |
| 10 | Đăng xuất và kiểm tra token trong `localStorage` | 1. Đăng nhập bằng một tài khoản.<br>2. Mở `/cart` (nơi có nút **Đăng xuất**) và bấm **Đăng xuất**.<br>3. Mở DevTools → **Application** → **Local Storage**.<br>4. Truy cập lại `/member/dashboard` hoặc `/admin/plans`. | `localStorage` không còn `token`, `user` và `access_token`; các trang được bảo vệ chuyển về `/login`; request tiếp theo không còn header `Authorization: Bearer ...`. |  |  |

## 3. Cross-test Store (kiểm tra chéo sau khi hoàn thiện module Gym)

| STT | Chức năng | Các bước thực hiện | Kết quả mong đợi | Kết quả thực tế | Pass/Fail |
|---|---|---|---|---|---|
| S1 | Thêm sản phẩm vào giỏ hàng | 1. Đăng nhập bằng tài khoản Member.<br>2. Mở `/shop`, chọn một sản phẩm.<br>3. Chọn phiên bản (flavor/size) còn hàng.<br>4. Bấm **Thêm vào giỏ**, sau đó mở `/cart`.<br>5. Thử lại khi chưa đăng nhập. | Sản phẩm xuất hiện trong giỏ với đúng tên, phiên bản, số lượng và tạm tính; badge giỏ hàng tăng; có thể tăng/giảm số lượng và xóa món. Khi chưa đăng nhập, hệ thống yêu cầu đăng nhập trước khi thêm. |  |  |
| S2 | Thanh toán COD | 1. Chuẩn bị giỏ có ít nhất 1 sản phẩm.<br>2. Mở Swagger `http://localhost:5000/docs` hoặc Postman.<br>3. Gọi `POST /api/store/orders` với Bearer token và body: `recipient_name`, `recipient_phone`, `shipping_address`, `payment_method = "cod"`. | API trả `201`; đơn được tạo với `status = 'pending'`; payment có `payment_method = 'cod'`, `status = 'pending'`; tồn kho giảm đúng số lượng; giỏ hàng trống sau khi đặt; `total_amount = subtotal - discount_amount`. |  |  |
| S3 | Áp dụng giảm giá hội viên | 1. Dùng `member@gym.local` (gói Active) đặt đơn COD như S2.<br>2. Ghi lại `subtotal`, `discount_amount`, `total_amount`.<br>3. Lặp lại với `david.pham@gmail.com` (gói Expired). | Member có gói Active: `discount_amount` = 10% `subtotal`, `total_amount` = 90% `subtotal`. Member hết hạn/không có gói: `discount_amount = 0`, `total_amount = subtotal`. |  |  |
| S4 | Xem lịch sử đơn hàng | 1. Sau khi đặt đơn ở S2, mở trang lịch sử đơn của Member (hoặc gọi `GET /api/store/orders` nếu đã có).<br>2. So sánh với bảng `orders` trong DB. | Chỉ hiển thị đơn của chính người dùng đang đăng nhập; sắp xếp mới nhất trước; đúng mã đơn, ngày đặt, tổng tiền và trạng thái; không lộ đơn của người khác. |  |  |
| S5 | Admin đổi trạng thái đơn hàng | 1. Đăng nhập Admin, mở trang quản lý đơn hàng.<br>2. Đổi một đơn từ `pending` → `confirmed` → `shipping` → `delivered`.<br>3. Kiểm tra lại phía Member và số liệu doanh thu Admin Dashboard. | Trạng thái đơn cập nhật đúng theo từng bước; Member thấy trạng thái mới; chỉ Admin/Staff được phép đổi; giá trị ngoài enum (`pending`, `confirmed`, `shipping`, `delivered`, `cancelled`) bị từ chối; đơn `delivered` được tính vào doanh thu Dashboard. |  |  |

## 4. Ghi chú & phát hiện trong quá trình chuẩn bị test

1. **Xóa mềm gói tập:** schema hiện tại dùng `membership_plans.status` với hai giá trị `active` / `hidden`, không có cột `is_active`. Vì vậy "xóa mềm (`is_active = false`)" được hiểu là `status = 'hidden'`. `GET /api/plans` chỉ trả gói `active`.
2. **Thông báo lỗi check-in:** giao diện hiện hiển thị thông báo chung `Check-in failed.` cho mọi lỗi (kể cả gói hết hạn). Nếu cần hiển thị rõ `MEMBERSHIP_EXPIRED`, cần bổ sung đọc `error.message` từ response.
3. **Đăng xuất:** nút **Đăng xuất** hiện chỉ có ở trang `/cart` và chỉ gọi `clearAccessToken()` — tức chỉ xóa `access_token`, chưa xóa `token`/`user` của `AuthContext`. Test case 10 có thể **Fail**; cần gọi thêm `logout()` của `AuthContext` (hoặc dùng chung một hàm đăng xuất).
4. **Giảm giá hội viên:** là giảm giá tự động 10% khi user có membership `active` còn hạn, không phải nhập mã coupon. Logic nằm trong `backend/src/repositories/orderRepository.js`.
5. **Phạm vi Store hiện tại:** đã có API giỏ hàng (`/api/store/cart`) và tạo đơn COD (`POST /api/store/orders`). Chưa có API/UI cho **lịch sử đơn** (S4) và **cập nhật trạng thái đơn** (S5); hai case này cần chờ task tương ứng hoặc kiểm tra tạm qua DB/Swagger. Trang `/cart` cũng chưa có form checkout (đang ghi "bước thanh toán sẽ được bổ sung sau").
6. **Thứ tự test đề xuất:** chạy mục 2 (Gym) trước, sau đó mục 3 (Store) để kiểm tra chéo dữ liệu membership ảnh hưởng tới giảm giá và doanh thu.
