import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

/**
 * LoginPage - Login page.
 * Calls POST /auth/login, saves token to localStorage via AuthContext.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleSignInEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      // Chuyển tới khu vực phù hợp sau khi backend xác nhận quyền tài khoản.
      const home = { admin: '/admin/dashboard', staff: '/staff/check-in', member: '/member/dashboard' };
      // Trở lại mục khách đang tìm; chỉ chấp nhận đường dẫn nội bộ.
      const from = location.state?.from;
      const destination = typeof from === 'string' && /^\/(?![/\\])/.test(from) ? from : home[user.role] || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential) {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(credential);
      const home = { admin: '/admin/dashboard', staff: '/staff/check-in', member: '/member/dashboard' };
      const from = location.state?.from;
      const destination = typeof from === 'string' && /^\/(?![/\\])/.test(from) ? from : home[user.role] || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-xl shadow-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">Login</h1>
          <p className="text-sm text-muted">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 px-3 py-3 rounded-lg border border-red-200" role="alert">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-semibold text-ink">Email</label>
            <Input
              id="login-email"
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-semibold text-ink">Password</label>
            <Input
              id="login-password"
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Login
          </Button>
        </form>

        {googleSignInEnabled && (
          <>
            <div className="flex items-center gap-3 text-xs text-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />
              <span>or continue with</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
          </>
        )}

        <p className="text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="text-brand-700 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
