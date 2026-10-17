import { ArrowDownRight, ArrowUpRight, Boxes, CircleDollarSign, ClipboardList, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Brand.jsx'

const metrics = [
  { label: 'Net sales', value: '$12,840', change: '+12.8%', icon: CircleDollarSign, up: true },
  { label: 'Orders', value: '284', change: '+8.2%', icon: ClipboardList, up: true },
  { label: 'Products', value: '68', change: '4 low stock', icon: Boxes, up: false },
  { label: 'Customers', value: '1,429', change: '+5.4%', icon: Users, up: true },
]

const orders = [
  { id: '#FF-2084', customer: 'Jordan Lee', product: 'Daily Whey, Pure Creatine', status: 'Processing', total: '$70.00' },
  { id: '#FF-2083', customer: 'Taylor Nguyen', product: 'Hydrate+ Electrolytes', status: 'Shipped', total: '$24.00' },
  { id: '#FF-2082', customer: 'Sam Rivera', product: 'Daily Whey', status: 'Delivered', total: '$42.00' },
]

function AdminDashboardPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><Eyebrow>Store overview</Eyebrow><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Good morning, Alex</h1><p className="mt-2 text-sm text-muted">Here&apos;s what&apos;s happening with your store today.</p></div>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-brand-700" type="button"><Boxes size={16} aria-hidden="true" /> Add product</button>
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Store metrics">
        {metrics.map(({ label, value, change, icon: Icon, up }) => <article className="rounded-card border border-line bg-white p-5" key={label}>
          <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted">{label}</span><span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={18} aria-hidden="true" /></span></div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-2"><strong className="font-display text-2xl tracking-tight">{value}</strong><span className={`inline-flex items-center gap-1 text-[11px] font-bold ${up ? 'text-brand-700' : 'text-amber-700'}`}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{change}</span></div>
        </article>)}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="overflow-hidden rounded-card border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6"><div><h2 className="font-display font-extrabold">Recent orders</h2><p className="mt-1 text-xs text-muted">A quick look at your latest activity.</p></div><button className="rounded-lg border border-line px-3 py-2 text-xs font-bold text-ink hover:bg-paper" type="button">Last 7 days</button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-paper/70 text-[10px] font-bold uppercase tracking-wider text-muted"><tr><th className="px-5 py-3 sm:px-6">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right sm:px-6">Total</th></tr></thead><tbody>{orders.map((order) => <tr className="border-t border-line" key={order.id}><td className="px-5 py-4 font-bold sm:px-6">{order.id}</td><td className="px-5 py-4">{order.customer}</td><td className="max-w-40 truncate px-5 py-4 text-muted">{order.product}</td><td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">{order.status}</span></td><td className="px-5 py-4 text-right font-bold sm:px-6">{order.total}</td></tr>)}</tbody></table></div>
          <div className="border-t border-line px-5 py-4 sm:px-6"><button className="text-xs font-bold text-brand-700 hover:text-ink" type="button">View all orders <ArrowUpRight className="ml-1 inline" size={13} aria-hidden="true" /></button></div>
        </article>
        <article className="rounded-card border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-display font-extrabold">Inventory pulse</h2><p className="mt-1 text-xs text-muted">Stock that needs attention</p></div><span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><Boxes size={18} aria-hidden="true" /></span></div>
          <div className="mt-6 space-y-5">{[['Pure Creatine', 18], ['Daily Whey · Vanilla', 34], ['Hydrate+ Citrus', 61]].map(([name, level]) => <div key={name}><div className="mb-2 flex justify-between gap-3 text-xs"><span className="font-semibold">{name}</span><span className="text-muted">{level} units</span></div><div className="h-2 rounded-full bg-paper"><div className={`h-full rounded-full ${level < 25 ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${level}%` }} /></div></div>)}</div>
          <Link className="mt-7 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-ink" to="/admin/products">Manage products <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </article>
      </section>
    </div>
  )
}

export default AdminDashboardPage
