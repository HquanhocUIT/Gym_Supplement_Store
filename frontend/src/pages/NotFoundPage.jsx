import { ArrowLeft, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-12 text-center">
      <div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Dumbbell size={24} aria-hidden="true" /></span><p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">404 · Page not found</p><h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.06em]">This route is off the map.</h1><p className="mt-3 text-sm leading-6 text-muted">The page may have moved, or the address may be incorrect.</p><Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-brand-700" to="/"><ArrowLeft size={16} aria-hidden="true" /> Back to the store</Link></div>
    </main>
  )
}

export default NotFoundPage
