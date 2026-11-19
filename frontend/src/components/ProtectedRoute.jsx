import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute kiểm tra quyền truy cập trước khi render các con.
 * - allowedRoles: mảng role được phép (ví dụ ['admin'], ['admin', 'staff']).
 * - Nếu chưa login -> redirect về /login.
 * - Nếu login nhưng role không khớp -> redirect về /403.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night">
        <p className="text-white text-center mt-10">Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
