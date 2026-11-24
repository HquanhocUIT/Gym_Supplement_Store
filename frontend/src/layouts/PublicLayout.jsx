import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CircleUserRound, Search, ShoppingBag } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BrandMark } from '../components/Brand';
import { getAccessToken } from '../lib/authToken';
import { getCart } from '../lib/cartApi';
import { useAuth } from '../contexts/AuthContext';

function PublicLayout() {
  const { user } = useAuth();
  const [hasToken, setHasToken] = useState(() => Boolean(getAccessToken()));

  // Cập nhật trạng thái đăng nhập khi các trang auth lưu hoặc xóa token.
  useEffect(() => {
    const updateTokenState = () => setHasToken(Boolean(getAccessToken()));
    window.addEventListener('auth-token-changed', updateTokenState);
    return () => window.removeEventListener('auth-token-changed', updateTokenState);
  }, []);

  // Chỉ tải giỏ hàng khi người dùng đã đăng nhập.
  const cartQuery = useQuery({
    queryKey: ['store-cart'],
    queryFn: getCart,
    enabled: hasToken,
    retry: false,
  });
  const cartCount = (cartQuery.data?.items || []).reduce(
    (total, item) => total + Number(item.quantity || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <nav
            className="order-3 flex w-full min-w-0 flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold text-ink-soft lg:order-none lg:w-auto lg:gap-7 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center"
            aria-label="Store navigation"
          >
            <NavLink
              className={({ isActive }) => isActive ? 'transition text-brand-700' : 'transition hover:text-brand-700'}
              to="/shop"
            >
              Shop
            </NavLink>
            <NavLink
              className={({ isActive }) => isActive ? 'transition text-brand-700' : 'transition hover:text-brand-700'}
              to="/pricing"
            >
              Membership plans
            </NavLink>
            <Link className="transition hover:text-brand-700" to="/store#why-us">
              Our standard
            </Link>
            <NavLink
              className={({ isActive }) => isActive ? 'transition text-brand-700' : 'transition hover:text-brand-700'}
              to="/member"
            >
              Member area
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              className="grid size-11 place-items-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink"
              to="/shop"
              aria-label="Search products"
            >
              <Search size={19} aria-hidden="true" />
            </Link>
            <Link
              className="relative grid size-11 place-items-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink"
              to="/cart"
              aria-label={`Shopping cart, ${cartCount} items`}
            >
              <ShoppingBag size={19} aria-hidden="true" />
              {cartCount > 0 && (
                <span
                  className="absolute right-0 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-ink"
                  aria-hidden="true"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition hover:bg-brand-700"
              to={hasToken ? '/member' : '/login'}
              aria-label={hasToken ? 'My account' : 'Sign in'}
            >
              <CircleUserRound size={16} aria-hidden="true" />
              <span className="hidden sm:inline">{hasToken ? 'My account' : 'Sign in'}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main className="min-w-0 break-words">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandMark />
          <Link
            className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand-700"
            to={user?.role === 'admin' ? '/admin/dashboard' : hasToken ? '/member' : '/login'}
          >
            {user?.role === 'admin' ? 'Administration' : hasToken ? 'My account' : 'Sign in'} <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
