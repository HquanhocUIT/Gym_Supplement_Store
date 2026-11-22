import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminLoginPage from './pages/AdminLoginPage';
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
import PlanManagement from './pages/admin/PlanManagement';
import MemberList from './pages/admin/MemberList';
import AdminDashboard from './pages/admin/AdminDashboard';
import CheckInScreen from './pages/staff/CheckInScreen';
import MembershipForm from './pages/staff/MembershipForm';
import MemberDashboard from './pages/member/MemberDashboard';

function App() {
  return (
    <>
      <Routes>
      {/* Các trang đăng nhập và đăng ký. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Trang gym và cửa hàng dành cho khách. */}
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

      {/* Khu hội viên yêu cầu đăng nhập. */}
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={['member', 'admin', 'staff']}>
            <MemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MemberDashboardPage />} />
        <Route path="dashboard" element={<MemberDashboard />} />
      </Route>

      {/* Các trang quản trị chỉ dành cho admin. */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="plans" element={<PlanManagement />} />
        <Route path="members" element={<MemberList />} />
      </Route>

      {/* Staff check-in page (requires staff or admin role). */}
      <Route
        path="/staff/check-in"
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <CheckInScreen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/renew"
        element={
          <ProtectedRoute allowedRoles={['staff', 'admin']}>
            <MembershipForm />
          </ProtectedRoute>
        }
      />

      {/* Các đường dẫn chưa khai báo hiển thị trang 404. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
