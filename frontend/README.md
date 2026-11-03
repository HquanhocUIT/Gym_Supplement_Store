# Frontend

React + Vite client styled with Tailwind CSS. The current pages use sample data to demonstrate the three layout shells and routing.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Sample routes

- `/` — public store layout
- `/admin` — admin dashboard layout
- `/admin/products` — sample product inventory page
- `/member` — member dashboard layout
- `/ui-kit` — shared UI components from Task 5
- `/ui-kit/common` — API client and common component examples from Task 6

Colors, typography, and custom spacing utilities are defined in `src/index.css` under `@theme`.

## Task 6: API client và component dùng chung

Giữ code theo từng file nhỏ, comment tiếng Việt ở các phần xử lý chính.

### Cấu hình API

Copy `frontend/.env.example` thành `frontend/.env` nếu cần đổi địa chỉ API:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Nếu chưa tạo file, client mặc định dùng địa chỉ trên. Vite đọc `.env` trong
`frontend/`; `.env` ở thư mục gốc vẫn dành cho backend. Sau khi sửa biến môi
trường frontend, khởi động lại Vite. Chỉ đưa URL công khai vào `VITE_*`.

- `src/lib/apiClient.js`: Axios dùng chung, timeout 10 giây và thông báo lỗi.
- `src/lib/queryClient.js`: cấu hình cache 30 giây, thử lại một lần với lỗi mạng/server.
- `src/hooks/useApiQuery.js`: hook GET dùng chung, hỗ trợ bộ lọc và hủy request.
- `src/main.jsx`: bọc ứng dụng trong `QueryClientProvider`.

Ví dụ gọi API health từ một component:

```jsx
import useApiQuery from './hooks/useApiQuery.js'

const health = useApiQuery({ queryKey: ['health'], url: '/health' })
// health.data là phần data bên trong { success, data, error }.
// Dùng health.isPending, health.isError, health.error và health.refetch khi hiển thị.
```

Với danh sách, truyền `params: { page, category }`. Hook đưa URL và params vào
query key để các trang/bộ lọc có cache riêng. Các tùy chọn như `enabled`,
`staleTime`, `retry` được chuyển tiếp cho TanStack Query.

`apiClient` vẫn trả Axios response gốc để dùng cho các thao tác POST/PUT/DELETE
sau này. Token đăng nhập sẽ bổ sung ở task Auth, không tự giả lập trong Task 6.

### Component

Import từ `src/components/common/index.js`:

| Component | Cách dùng |
| --- | --- |
| `Skeleton` | Khối giữ chỗ; truyền `className` để đặt kích thước. |
| `SkeletonCard` | Loading cho thẻ sản phẩm. Trang cha đặt thông báo `role="status"`. |
| `EmptyState` | Nhận `title`, `description`, `icon` và `action` tùy chọn. |
| `Pagination` | Nhận `page` (bắt đầu từ 1), `pageSize` (số nguyên > 0), `total`, `onPageChange`, `disabled`. |
| `ImageUploader` | Nhận `value` là File/URL/null, `onChange`, `label`, `maxSizeMB`, `disabled`, `error`. |

Ví dụ chọn ảnh cho form:

```jsx
const [image, setImage] = useState(null)
<ImageUploader value={image} onChange={setImage} />
```

ImageUploader nhận JPG/PNG/WebP, mặc định tối đa 5 MB; có xem trước, xóa ảnh,
báo lỗi tại chỗ và thu hồi URL local khi đổi ảnh/rời trang. Việc gửi file lên
Supabase thuộc Task 30. Backend upload cần kiểm tra file lại, không chỉ dựa vào
kiểm tra ở frontend.

### Kiểm tra và chụp minh chứng

```powershell
npm run lint
npm test
npm run build
npm run dev
```

Mở `/ui-kit/common`. Chạy backend ở terminal khác rồi bấm **Kiểm tra API**.
Thử phân trang, danh sách rỗng, chọn ảnh hợp lệ, chọn file sai và xóa ảnh.
Chụp trang demo và kết quả lint/test/build; tránh chụp nội dung `.env`.

Tài liệu: [Axios](https://axios-http.com/docs/instance),
[TanStack Query](https://tanstack.com/query/latest/docs/framework/react/quick-start).
