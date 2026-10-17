import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import MemberLayout from './layouts/MemberLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminProductsPage from './pages/AdminProductsPage.jsx'
import MemberDashboardPage from './pages/MemberDashboardPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import StoreHomePage from './pages/StoreHomePage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<StoreHomePage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
        </Route>
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<MemberDashboardPage />} />
        </Route>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
