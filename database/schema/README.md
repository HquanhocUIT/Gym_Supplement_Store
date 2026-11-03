# SQL khởi tạo database

Docker Compose mount thư mục này vào `/docker-entrypoint-initdb.d` ở chế độ chỉ đọc.

- PostgreSQL chỉ tự chạy các file `.sql`, `.sql.gz` hoặc `.sh` theo thứ tự tên
  khi khởi tạo một volume database mới. File README này không được thực thi.
- Schema Auth/Gym (`01_auth_gym.sql`) và Store (`02_store.sql`) được tạo ở Task
  14–15 sau khi nhóm review và chốt ERD. Task 8 chưa tạo bảng hoặc dữ liệu mẫu.
- Thay đổi sau khi chốt schema cần đi qua migration theo quy ước của nhóm; thêm
  một file vào đây không tự cập nhật database đã khởi tạo.
