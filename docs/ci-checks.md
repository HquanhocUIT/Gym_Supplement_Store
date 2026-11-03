# CI cho pull request

Workflow `.github/workflows/ci.yml` chạy khi PR được mở, cập nhật, mở lại, đổi
tiêu đề hoặc chuyển khỏi draft. Các job độc lập:

- **Frontend lint and build:** `npm ci`, `npm run lint`, `npm run build` trong `frontend/`.
- **Backend lint and health:** `npm ci`, lint bằng Oxlint và chạy health API.
- **PR title:** kiểm tra tiêu đề theo Conventional Commits.
- **Backend tests:** chạy `npm test` khi `backend/package.json` đã có sau Task 3.
- **Docker build:** build image từ `backend/Dockerfile` khi Task 8 đã được merge.

Job **Detect backend and Dockerfile** kiểm tra hai file trên. Khi chưa có file,
job tương ứng hiện **Skipped** trên GitHub; trạng thái này không có nghĩa là test
hoặc Docker build đã chạy. Khi file xuất hiện, job sẽ tự chạy trên các PR tiếp theo.

`main` hiện dùng `server/`; PR Task 3 chuyển backend thành `backend/`. CI ưu tiên
`backend/` khi thư mục này có `package.json`, nếu chưa có thì dùng `server/`.
Nếu không có cả hai, job báo lỗi. Với `server/` cũ, health chỉ có `/api/health`;
`backend/` mới phải có `/health`. CI không cần kết nối PostgreSQL hay Supabase.

Oxlint được chạy với phiên bản cố định `1.81.0`. Cấu hình
`ci/oxlint-backend.json` cho phép tham số `_...` hoặc `next` chưa sử dụng, vì
middleware Express có thể cần giữ đủ bốn tham số. Các cảnh báo khác làm job đỏ.

Ví dụ tiêu đề hợp lệ:

```text
feat(store): add product catalog
fix(api): handle errors
ci: add lint and build checks
```

Tiêu đề dạng `[Task 11] Add CI` chưa đúng; dùng `ci: add checks` thay thế.

## Kiểm tra trên máy

```bash
cd frontend
npm ci
npm run lint
npm run build
cd ..
npm ci --prefix server
npx --yes oxlint@1.81.0 --deny-warnings --config ci/oxlint-backend.json server/src
node ci/smoke-health.cjs server
node --test ci/check-pr-title.test.cjs
```

Sau khi Task 3 merge, đổi `server` thành `backend` ở ba lệnh tương ứng. Dùng
`PR_TITLE='ci: add checks' node ci/check-pr-title.cjs` trên Bash để thử tiêu đề.
Trên PowerShell, đặt `$env:PR_TITLE = 'ci: add checks'` rồi chạy lệnh `node`.

## Cấu hình bảo vệ main

Sau khi PR có workflow được chạy ít nhất một lần, người có quyền admin mở
**Settings → Branches → main → Require status checks to pass before merging**,
giữ các yêu cầu review đang có và chọn ba job của workflow CI hiển thị trong
GitHub: **Frontend lint and build**, **Backend lint and health**, **PR title**.
Không thay thế hay xóa các status check khác đang được yêu cầu.

Để kiểm tra trên GitHub, tạo một PR thử có lỗi build, xác nhận job frontend đỏ
và nút merge bị chặn; sau đó đóng PR thử. Việc này cần có PR thử thực tế và
branch protection đã bật; kết quả chạy trên máy không tự chứng minh được.
