import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import MemberLayout from './layouts/MemberLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminProductsPage from './pages/AdminProductsPage.jsx'
import MemberDashboardPage from './pages/MemberDashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import StoreHomePage from './pages/StoreHomePage.jsx'
import UiKit from './pages/UiKit'; 
import CommonComponentsPage from './pages/CommonComponentsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<StoreHomePage />} />
          {/* Đã thêm route ui-kit ở đây */}
          <Route path="ui-kit" element={<UiKit />} />
          {/* Trang minh chứng cho các component và API client của Task 6. */}
          <Route path="ui-kit/common" element={<CommonComponentsPage />} />
        </Route>
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
        </Route>
        
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<MemberDashboardPage />} />
        </Route>

        {/* Thêm route 404 nếu Người 2 đã chuẩn bị trang này */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
