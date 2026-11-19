import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute kiểm tra quyền truy cập trước khi render các con.
 * allowedRoles: mảng các role được phép vào (ví dụ: ['admin'], ['staff', 'admin']).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84cc16]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
