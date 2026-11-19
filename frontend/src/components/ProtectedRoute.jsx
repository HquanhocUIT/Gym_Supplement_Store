import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute checks access rights before rendering children.
 * - allowedRoles: array of allowed roles (e.g. ['admin'], ['admin', 'staff']).
 * - If not logged in -> redirect to /login.
 * - If logged in but role doesn't match -> redirect to /403.
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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}
