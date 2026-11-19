import { Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import StoreHomePage from './pages/StoreHomePage';
import UiKit from './pages/UiKit';
import CommonComponentsPage from './pages/CommonComponentsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForbiddenPage from './pages/ForbiddenPage';

function App() {
  return (
    <Routes>
      {/* Auth routes (public) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Public store routes */}
      <Route element={<PublicLayout />}>
        <Route index element={<StoreHomePage />} />
        <Route path="ui-kit" element={<UiKit />} />
        <Route path="ui-kit/common" element={<CommonComponentsPage />} />
      </Route>

      {/* Member routes (requires 'member' role) */}
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={['member', 'admin', 'staff']}>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboardPage />} />
      </Route>

      {/* Admin routes (requires 'admin' role) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
      </Route>

      {/* Staff routes (requires 'staff' role) - ví dụ mở rộng sau này */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <div className="p-8 text-center text-white">
              <h1 className="text-2xl font-bold">Staff Dashboard</h1>
              <p className="text-muted">Chào mừng nhân viên!</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


export default App;
