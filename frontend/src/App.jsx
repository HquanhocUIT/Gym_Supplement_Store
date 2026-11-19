import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import StoreHomePage from './pages/StoreHomePage';
import StoreShopPage from './pages/StoreShopPage';
import StoreProductDetailPage from './pages/StoreProductDetailPage';
import StoreCartPage from './pages/StoreCartPage';
import UiKit from './pages/UiKit';
import CommonComponentsPage from './pages/CommonComponentsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForbiddenPage from './pages/ForbiddenPage';
import LandingPage from './pages/public/LandingPage';
import PricingPage from './pages/public/PricingPage';

function App() {
  return (
    <Routes>
      {/* Các trang đăng nhập và đăng ký không cần đăng nhập trước. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Các trang công khai của gym và cửa hàng dùng chung thanh điều hướng. */}
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="store" element={<StoreHomePage />} />
        <Route path="shop" element={<StoreShopPage />} />
        <Route path="product/:productId" element={<StoreProductDetailPage />} />
        <Route path="cart" element={<StoreCartPage />} />
        <Route path="ui-kit" element={<UiKit />} />
        <Route path="ui-kit/common" element={<CommonComponentsPage />} />
      </Route>

      {/* Khu vực hội viên chỉ dành cho người đã đăng nhập. */}
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={['member', 'admin', 'staff']}>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboardPage />} />
        <Route path="dashboard" element={<MemberDashboardPage />} />
      </Route>

      {/* Trang quản trị chỉ dành cho admin. */}
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

      {/* Giữ đường dẫn check-in cho nhân viên; màn hình sẽ được bổ sung ở task riêng. */}
      <Route
        path="/staff/check-in"
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <div className="p-8 text-center text-ink">
              <h1 className="text-2xl font-bold">Staff Check-in</h1>
              <p className="text-muted">The check-in page is not available yet.</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Chuyển đường dẫn lạ tới trang 404. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
