import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * RegisterPage - Trang đăng ký.
 * Gọi POST /auth/register, lưu token vào localStorage qua AuthContext.
 * Tài khoản mới mặc định role = member.
 */
export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [full_name, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, full_name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3]">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-xl shadow-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">Đăng ký</h1>
          <p className="text-sm text-muted">Tạo tài khoản mới</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50/50 px-3 py-2 rounded border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">Họ và tên</label>
            <Input
              required
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink">Mật khẩu</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Đăng ký
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-[#84cc16] font-medium hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
