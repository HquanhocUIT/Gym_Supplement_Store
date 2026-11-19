import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-4">
      <div className="max-w-md w-full border-2 border-[#9aca42] bg-[#22332b] p-10 rounded-lg shadow-[0_0_20px_rgba(138,202,66,0.25)] text-center">
        <div className="text-[#9aca42] text-6xl mb-4">403</div>
        <h1 className="text-2xl font-bold text-white mb-2">Bạn không có quyền truy cập</h1>
        <p className="text-muted text-sm mb-8">
          Tài khoản của bạn không được phép vào trang này. Vui lòng đăng nhập với quyền thích hợp.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 py-3 px-6 border border-[#9aca42] text-sm font-bold rounded-lg text-white bg-[#9aca42] hover:bg-[#7cac2c] transition-all"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
