import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

/**
 * RegisterPage - Registration page.
 * Calls POST /auth/register, saves token to localStorage via AuthContext.
 * New account defaults to role = member.
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
      setError(err.response?.data?.error?.message || err.message || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-xl shadow-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">Register</h1>
          <p className="text-sm text-muted">Create a new account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 px-3 py-3 rounded-lg border border-red-200" role="alert">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="register-name" className="block text-sm font-semibold text-ink">Full name</label>
            <Input
              id="register-name"
              autoComplete="name"
              required
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-email" className="block text-sm font-semibold text-ink">Email</label>
            <Input
              id="register-email"
              autoComplete="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-password" className="block text-sm font-semibold text-ink">Password</label>
            <Input
              id="register-password"
              autoComplete="new-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Register
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-700 font-medium hover:underline">
            Login now
          </Link>
        </p>
      </div>
    </div>
  );
}
