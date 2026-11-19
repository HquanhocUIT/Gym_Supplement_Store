import { Outlet, Link } from 'react-router-dom';

/**
 * PublicLayout - Layout cho các trang công khai (Landing, Pricing).
 * Có navbar và footer.
 */
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f4f6f3] text-ink flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#e3e9e1]">
        <div className="px-4 py-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-ink">
              Gym Supplement Store
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="text-sm font-medium text-[#3a4a3e] hover:text-[#84cc16]">
                Gói tập
              </Link>
              <Link to="/login" className="px-4 py-2 border border-[#84cc16] text-[#84cc16] rounded-lg text-sm font-medium hover:bg-[#84cc16] hover:text-white transition-colors">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e3e9e1] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted">&copy; 2026 Gym Supplement Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
