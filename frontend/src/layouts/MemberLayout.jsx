import { ArrowUpRight, CircleUserRound, Dumbbell, LogOut } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BrandMark } from '../components/Brand.jsx'
import { useAuth } from '../contexts/AuthContext'

function MemberLayout() {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const mainRef = useRef(null)

  // Đưa tiêu điểm tới nội dung mới để người dùng nhận biết đã chuyển trang.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])
  function signOut() {
    logout()
    queryClient.clear()
    navigate('/login')
  }
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <nav className="order-3 flex w-full flex-wrap gap-2 text-sm font-semibold text-ink-soft lg:order-none lg:w-auto" aria-label="Member navigation">
            {[
              ['/member', 'Overview', true], ['/member/plan', 'My plan'], ['/member/orders', 'Orders'],
            ].map(([to, label, end]) => <NavLink key={to} end={end} to={to} className={({ isActive }) => `inline-flex min-h-11 items-center rounded-xl px-4 focus-visible:outline-2 focus-visible:outline-brand-700 ${isActive ? 'bg-brand-100 text-brand-700' : 'hover:bg-paper hover:text-brand-700'}`}>{label}</NavLink>)}
          </nav>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-brand-700"><CircleUserRound size={17} aria-hidden="true" /></span>
            <span className="max-w-40 break-words text-sm font-bold text-ink">{user?.full_name || 'My account'}</span>
            {user?.role === 'admin' && <Link className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold hover:bg-paper" to="/admin/dashboard">Administration</Link>}
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand-700" onClick={signOut}><LogOut size={16} aria-hidden="true" /> Sign out</button>
          </div>
        </div>
      </header>
      <main ref={mainRef} tabIndex={-1} className="mx-auto min-h-[70vh] max-w-7xl break-words px-4 py-8 outline-none sm:px-6 sm:py-12 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2"><Dumbbell size={15} aria-hidden="true" /> Your training, your pace.</span>
          <Link className="inline-flex min-h-11 items-center gap-1 font-bold text-ink hover:text-brand-700" to="/shop">Browse the store <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </div>
      </footer>
    </div>
  )
}

export default MemberLayout
