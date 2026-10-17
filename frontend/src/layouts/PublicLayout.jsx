import { ArrowUpRight, Search, ShoppingBag } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '../components/Brand.jsx'

function PublicLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-night px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white sm:text-xs">
        TRAIN SMARTER. FEEL STRONGER. FREE SHIPPING ON ORDERS OVER $75.
      </div>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto whitespace-nowrap text-sm font-semibold text-ink-soft sm:order-none sm:w-auto sm:gap-7" aria-label="Store navigation">
            <a className="transition hover:text-brand-700" href="#catalog">Shop</a>
            <a className="transition hover:text-brand-700" href="#why-us">Our standard</a>
            <NavLink className="transition hover:text-brand-700" to="/member">Member area</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <button className="grid size-10 place-items-center rounded-full text-ink-soft transition hover:bg-paper hover:text-ink" type="button" aria-label="Search products (demo)">
              <Search size={19} aria-hidden="true" />
            </button>
            <Link className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition hover:bg-brand-700" to="/member">
              <ShoppingBag size={16} aria-hidden="true" />
              <span className="hidden sm:inline">My account</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandMark />
          <p>Good training starts with a plan. Form &amp; Fuel is a project preview.</p>
          <Link className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brand-700" to="/admin">
            Admin preview <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
