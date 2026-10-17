import { ArrowLeft, ArrowUpRight, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Brand.jsx'

const products = [
  { name: 'Daily Whey', category: 'Protein', sku: 'FF-PRO-001', stock: 128, price: '$42.00', status: 'Active' },
  { name: 'Pure Creatine', category: 'Performance', sku: 'FF-PER-004', stock: 18, price: '$28.00', status: 'Low stock' },
  { name: 'Hydrate+ Electrolytes', category: 'Hydration', sku: 'FF-HYD-008', stock: 94, price: '$24.00', status: 'Active' },
  { name: 'Daily Greens', category: 'Wellness', sku: 'FF-WEL-011', stock: 0, price: '$36.00', status: 'Out of stock' },
]

function AdminProductsPage() {
  return (
    <div>
      <Link className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-ink" to="/admin"><ArrowLeft size={14} aria-hidden="true" /> Back to overview</Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Eyebrow>Store inventory</Eyebrow><h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.05em]">Products</h1><p className="mt-2 text-sm text-muted">Manage the products in your catalog.</p></div><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white hover:bg-brand-700" type="button"><Plus size={17} aria-hidden="true" /> Add product</button></div>
      <section className="mt-7 overflow-hidden rounded-card border border-line bg-white">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><label className="relative block"><span className="sr-only">Search products</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" /><input className="min-h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-600 sm:w-64" placeholder="Search products" type="search" /></label><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-bold text-ink hover:bg-paper" type="button"><SlidersHorizontal size={15} aria-hidden="true" /> Filter</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-paper/70 text-[10px] font-bold uppercase tracking-wider text-muted"><tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">SKU</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{products.map((product) => <tr className="border-t border-line" key={product.sku}><td className="px-5 py-4"><p className="font-bold">{product.name}</p><p className="mt-1 text-xs text-muted">{product.category}</p></td><td className="px-5 py-4 text-xs text-muted">{product.sku}</td><td className="px-5 py-4">{product.stock}</td><td className="px-5 py-4 font-bold">{product.price}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${product.status === 'Active' ? 'bg-brand-50 text-brand-700' : product.status === 'Low stock' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{product.status}</span></td><td className="px-5 py-4 text-right"><button className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink" type="button" aria-label={`Open ${product.name}`}><ArrowUpRight size={16} aria-hidden="true" /></button></td></tr>)}</tbody></table></div>
        <div className="border-t border-line px-5 py-4 text-xs text-muted">Showing {products.length} sample products</div>
      </section>
    </div>
  )
}

export default AdminProductsPage
