import { ArrowUpRight, Boxes, LayoutDashboard, Search, Settings } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '../components/Brand.jsx'

const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Boxes },
]

function NavItems({ mobile = false }) {
  return navigation.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={label}
      to={to}
      end={end}
      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-brand-500 text-ink' : 'text-white/65 hover:bg-white/8 hover:text-white'} ${mobile ? 'shrink-0' : ''}`}
    >
      <Icon size={18} aria-hidden="true" />
      {label}
    </NavLink>
  ))
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#f4f6f3] text-ink lg:flex">
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-night px-5 py-6 lg:flex">
        <BrandMark light />
        <p className="mb-3 mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Workspace</p>
        <nav className="space-y-1" aria-label="Admin navigation"><NavItems /></nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-white">Need a hand?</p>
          <p className="mt-1 text-xs leading-5 text-white/50">Store operations support is one click away.</p>
          <button className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-brand-500" type="button">
            Open help center <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-line bg-white px-4 py-4 sm:px-6 lg:px-9">
          <div className="flex items-center justify-between gap-4">
            <div className="lg:hidden"><BrandMark /></div>
          <p className="hidden text-sm font-semibold text-muted lg:block">Store management <span className="px-2 text-line">/</span> Overview</p>
            <div className="flex items-center gap-3">
              <button className="grid size-10 place-items-center rounded-full border border-line text-muted hover:bg-paper" type="button" aria-label="Search admin pages">
                <Search size={17} aria-hidden="true" />
              </button>
              <div className="grid size-10 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-700" role="img" aria-label="Admin user AQ">AQ</div>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden" aria-label="Admin navigation"><NavItems mobile /></nav>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-9 lg:py-10">
          <Outlet />
        </main>
        <div className="fixed bottom-5 right-5 hidden rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-muted shadow-card sm:block">
          <Settings className="mr-2 inline" size={14} aria-hidden="true" /> Admin preview
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
