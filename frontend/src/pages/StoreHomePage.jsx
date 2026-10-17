import { ArrowDown, ArrowRight, ArrowUpRight, Check, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Brand.jsx'

const products = [
  { name: 'Daily Whey', category: 'Protein blend', price: '$42', tone: 'bg-[#e7f2db]', label: 'BEST SELLER', mark: 'W', note: 'Vanilla oat · 30 servings' },
  { name: 'Pure Creatine', category: 'Strength support', price: '$28', tone: 'bg-[#e9eaf6]', label: '5G · PURE', mark: 'C', note: 'Unflavored · 60 servings' },
  { name: 'Hydrate+ Electrolytes', category: 'Training support', price: '$24', tone: 'bg-[#f8ead9]', label: 'NEW FORMULA', mark: 'H+', note: 'Citrus salt · 20 sticks' },
]

function ProductBottle({ product }) {
  return (
    <div className={`relative flex h-52 items-center justify-center overflow-hidden rounded-2xl ${product.tone}`}>
      <span className="absolute left-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.13em] text-ink-soft">{product.label}</span>
      <div className="absolute -right-10 -top-14 size-40 rounded-full border-[24px] border-white/35" />
      <div className="relative mt-7 flex h-32 w-24 flex-col items-center rounded-b-[1.15rem] rounded-t-md bg-white shadow-card">
        <div className="h-5 w-12 -translate-y-4 rounded-t-md bg-night" />
        <span className="-mt-2 grid size-10 place-items-center rounded-full bg-brand-100 font-display text-sm font-extrabold text-brand-700">{product.mark}</span>
        <span className="mt-2 text-[8px] font-black tracking-[0.12em] text-ink">FORM &amp; FUEL</span>
        <span className="mt-1 text-[7px] text-muted">{product.name}</span>
      </div>
    </div>
  )
}

function StoreHomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Eyebrow>Better habits. Stronger days.</Eyebrow>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.065em] text-ink sm:text-6xl lg:text-7xl">
            Built for your <span className="text-brand-700">next</span> personal best.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-ink-soft sm:text-lg sm:leading-8">
            Thoughtful essentials for the work you put in: quality-tested supplements, clear ingredients, and a routine that fits real life.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-brand-700" href="#catalog">
              Explore the shop <ArrowRight size={16} aria-hidden="true" />
            </a>
            <Link className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-white px-6 text-sm font-bold text-ink transition hover:border-brand-500" to="/member">
              Member area <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-ink-soft">
            <span className="inline-flex items-center gap-2"><Check size={15} className="text-brand-700" aria-hidden="true" /> Clear ingredient labels</span>
            <span className="inline-flex items-center gap-2"><Check size={15} className="text-brand-700" aria-hidden="true" /> Tested for quality</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -left-5 top-8 size-24 rounded-full bg-brand-100 blur-2xl sm:size-36" />
          <div className="relative overflow-hidden rounded-[2rem] bg-night p-6 text-white sm:p-9">
            <div className="absolute -right-20 -top-20 size-64 rounded-full border-[38px] border-white/5" />
            <div className="absolute -bottom-24 -left-12 size-56 rounded-full bg-brand-500/10 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div><Eyebrow dark>Daily foundation</Eyebrow><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Simple, solid, consistent.</h2></div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-brand-500"><Sparkles size={20} aria-hidden="true" /></span>
            </div>
            <div className="relative mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/8 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-brand-500"><Leaf size={18} aria-hidden="true" /></span>
                <p className="mt-5 text-sm font-bold">What you need</p><p className="mt-1 text-xs leading-5 text-white/55">Purposeful formulas, nothing extra.</p>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-brand-500"><ShieldCheck size={18} aria-hidden="true" /></span>
                <p className="mt-5 text-sm font-bold">What you can trust</p><p className="mt-1 text-xs leading-5 text-white/55">Transparent labels at every step.</p>
              </div>
            </div>
            <a className="relative mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-500 hover:text-white" href="#why-us">Our quality promise <ArrowUpRight size={15} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white" id="catalog">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><Eyebrow>Shop the essentials</Eyebrow><h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">A strong place to start.</h2></div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted"><ArrowDown size={14} aria-hidden="true" /> Sample catalog for the frontend scaffold</span>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article className="rounded-card border border-line bg-white p-3 transition hover:-translate-y-1 hover:shadow-card" key={product.name}>
                <ProductBottle product={product} />
                <div className="flex items-start justify-between gap-3 px-2 pb-2 pt-4">
                  <div><p className="text-xs font-semibold text-muted">{product.category}</p><h3 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h3><p className="mt-1 text-xs text-muted">{product.note}</p></div>
                  <span className="pt-1 text-sm font-extrabold text-ink">{product.price}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8" id="why-us">
        <div><Eyebrow>Our standard</Eyebrow><h2 className="mt-3 max-w-md font-display text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Good products should make sense.</h2></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['01', 'Clear by design', 'Ingredients and serving details are easy to understand.'],
            ['02', 'Made for routines', 'Useful essentials that fit into a balanced training plan.'],
            ['03', 'Progress together', 'A member space keeps your orders and plan in one place.'],
          ].map(([number, title, body]) => <article className="rounded-card border border-line bg-white p-5" key={number}><span className="text-xs font-extrabold text-brand-700">{number}</span><h3 className="mt-5 font-display font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></article>)}
        </div>
      </section>

      <section className="bg-brand-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-extrabold text-ink">Layout samples for the team</p><p className="mt-1 text-xs text-ink-soft">Use these routes to preview the admin and member shells.</p></div>
          <div className="flex flex-wrap gap-2"><Link className="rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-bold text-ink hover:border-brand-500" to="/admin">Admin dashboard</Link><Link className="rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-bold text-ink hover:border-brand-500" to="/member">Member dashboard</Link></div>
        </div>
      </section>
    </>
  )
}

export default StoreHomePage
