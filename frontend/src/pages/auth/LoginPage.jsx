import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(e.target.email.value, e.target.password.value);
      navigate('/member', { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full border-2 border-[#9aca42] bg-[#22332b] p-8 rounded-lg shadow-[0_0_20px_rgba(138,202,66,0.25)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Đăng nhập</h1>
          <p className="text-sm text-muted mt-2">Chào mừng bạn quay lại Form &amp; Fuel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 border rounded-lg text-sm text-white bg-[#18251f] focus:outline-none focus:ring-2 focus:ring-[#9aca42] focus:border-transparent transition-all placeholder:text-gray-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Mật khẩu</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border rounded-lg text-sm text-white bg-[#18251f] focus:outline-none focus:ring-2 focus:ring-[#9aca42] focus:border-transparent transition-all placeholder:text-gray-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded border border-red-500/30">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-[#9aca42] text-sm font-bold rounded-lg text-white bg-[#9aca42] hover:bg-[#7cac2c] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-white mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-[#9aca42] hover:text-[#7cac2c] font-semibold underline underline-offset-4">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
