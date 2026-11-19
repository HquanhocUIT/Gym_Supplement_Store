import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Gửi thông tin đăng nhập đến backend.
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const user = await login(email, password);

      // Chỉ cho tài khoản Admin tiếp tục vào trang quản lý.
      if (user?.role !== "admin") {
        logout();
        setErrorMessage("This account does not have Admin access.");
        return;
      }

      navigate("/admin/products", { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f3] px-4">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to manage store products.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1 block text-sm font-semibold"
              htmlFor="admin-email"
            >
              Email
            </label>
            <input
              id="admin-email"
              className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-semibold"
              htmlFor="admin-password"
            >
              Password
            </label>
            <input
              id="admin-password"
              className="min-h-11 w-full rounded-lg border border-line px-3 text-sm"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className="min-h-11 w-full rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminLoginPage;
