import { Link, useLocation, useNavigate } from 'react-router-dom';

// Từ danh sách mở chi tiết: quay đúng entry trước đó để giữ bộ lọc và phân trang.
// Mở trực tiếp hoặc từ tab mới: dùng đường dẫn dự phòng an toàn.
export default function ListBackLink({ fallback, children, ...props }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const from = state?.returnTo;
  const hasListOrigin = typeof from === 'string' && (from === fallback || from.startsWith(`${fallback}?`));
  return <Link {...props} to={hasListOrigin ? from : fallback} onClick={(event) => {
    if (hasListOrigin && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); navigate(-1);
    }
  }}>{children}</Link>;
}
