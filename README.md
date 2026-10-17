# Gym and Supplement Store Management System

**Group 28** — MSIS207.R11.CTTT

## Thành viên
| Vai trò | Họ tên | MSSV | Module |
|---|---|---|---|
| Người 1 | Nguyễn Đình Sang | [24521521] | Auth + Gym |
| Người 2 | Nguyễn Phan Hoàng Quân | [24521446] | Store |

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + Prisma
- **Database:** PostgreSQL (Supabase)
- **Deploy:** Vercel (FE), Render (BE)
- **Container:** Docker

## Cấu trúc thư mục

```text
frontend/   React + Vite client
server/     Express API and Prisma schema
.github/    Issue and pull request templates
```

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Vite hiển thị ứng dụng tại `http://localhost:5173`. Các route mẫu:

- `/`: cửa hàng công khai
- `/admin`: dashboard quản trị
- `/admin/products`: danh sách sản phẩm mẫu
- `/member`: dashboard thành viên
