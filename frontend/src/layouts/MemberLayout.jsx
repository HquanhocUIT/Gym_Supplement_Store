import { ArrowUpRight, CircleUserRound, Dumbbell, PackageCheck } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '../components/Brand.jsx'

function MemberLayout() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <nav className="order-3 flex w-full gap-5 overflow-x-auto whitespace-nowrap text-sm font-semibold text-ink-soft sm:order-none sm:w-auto" aria-label="Member navigation">
            <NavLink end className={({ isActive }) => isActive ? 'text-brand-700' : 'hover:text-brand-700'} to="/member">Overview</NavLink>
            <a className="hover:text-brand-700" href="#member-plan">My plan</a>
            <a className="hover:text-brand-700" href="#member-orders">Orders</a>
          </nav>
          <div className="flex items-center gap-2 rounded-full bg-paper py-1 pl-1 pr-3">
            <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-brand-700"><CircleUserRound size={17} aria-hidden="true" /></span>
            <span className="text-xs font-bold text-ink">Alex Morgan</span>
          </div>
        </div>
      </header>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-muted sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2"><Dumbbell size={15} aria-hidden="true" /> Your training, your pace.</span>
          <Link className="inline-flex items-center gap-1 font-bold text-ink hover:text-brand-700" to="/">Back to store <ArrowUpRight size={14} aria-hidden="true" /></Link>
          <span className="inline-flex items-center gap-1"><PackageCheck size={15} aria-hidden="true" /> Member preview</span>
        </div>
      </footer>
    </div>
  )
}

export default MemberLayout
