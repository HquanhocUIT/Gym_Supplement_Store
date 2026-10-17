import { ArrowRight, ArrowUpRight, CalendarDays, CircleCheck, Clock3, Dumbbell, PackageCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Brand.jsx'

const week = [
  { day: 'MON', name: 'Upper body', time: '45 min', done: true },
  { day: 'WED', name: 'Lower body', time: '50 min', done: false },
  { day: 'FRI', name: 'Full body', time: '40 min', done: false },
]

function MemberDashboardPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-[1.75rem] bg-night px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-11">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.6fr] lg:items-center">
          <div><Eyebrow dark>Your member space</Eyebrow><h1 className="mt-3 max-w-xl font-display text-4xl font-extrabold leading-tight tracking-[-0.055em] sm:text-5xl">One good choice at a time, Alex.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/60">Your weekly plan and recent orders are together here. Keep showing up and let consistency do its thing.</p><Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-extrabold text-ink transition hover:bg-white" to="/">Explore supplements <ArrowRight size={16} aria-hidden="true" /></Link></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white/55">WEEKLY MOVEMENT</p><p className="mt-2 font-display text-3xl font-extrabold">2 <span className="text-base font-semibold text-white/55">of 3 sessions</span></p></div><span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-ink"><Dumbbell size={20} aria-hidden="true" /></span></div><div className="mt-5 h-2 rounded-full bg-white/10"><div className="h-full w-2/3 rounded-full bg-brand-500" /></div><p className="mt-3 text-xs text-white/50">You&apos;re building a steady rhythm.</p></div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-card border border-line bg-white p-5 sm:p-6" id="member-plan">
          <div className="flex items-center justify-between gap-4"><div><Eyebrow>This week</Eyebrow><h2 className="mt-2 font-display text-xl font-extrabold">Your training plan</h2></div><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><CalendarDays size={18} aria-hidden="true" /></span></div>
          <div className="mt-5 space-y-3">{week.map(({ day, name, time, done }) => <article className="flex items-center gap-3 rounded-xl border border-line p-3" key={day}><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-paper text-[9px] font-extrabold tracking-wide text-muted">{day}</span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">{name}</h3><p className="mt-1 inline-flex items-center gap-1 text-xs text-muted"><Clock3 size={12} aria-hidden="true" /> {time}</p></div>{done ? <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700"><CircleCheck size={16} aria-hidden="true" /> Done</span> : <button className="rounded-full border border-line px-3 py-2 text-xs font-bold hover:border-brand-500" type="button">View plan</button>}</article>)}</div>
        </section>
        <section className="rounded-card border border-line bg-white p-5 sm:p-6" id="member-orders">
          <div className="flex items-center justify-between gap-4"><div><Eyebrow>Order history</Eyebrow><h2 className="mt-2 font-display text-xl font-extrabold">On its way</h2></div><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><PackageCheck size={18} aria-hidden="true" /></span></div>
          <article className="mt-5 rounded-2xl bg-paper p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-ink">Order #FF-2078</p><p className="mt-1 text-xs text-muted">Placed Oct 10 · 2 items</p></div><span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-extrabold text-brand-700">In transit</span></div><div className="mt-5 h-1.5 rounded-full bg-line"><div className="h-full w-3/4 rounded-full bg-brand-500" /></div><p className="mt-3 text-xs text-muted">Estimated delivery: Oct 18</p></article>
          <button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-ink" type="button">View all orders <ArrowUpRight size={13} aria-hidden="true" /></button>
        </section>
      </div>

      <section className="mt-6 flex flex-col gap-4 rounded-card border border-brand-100 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" id="member-next-step"><div><p className="text-sm font-extrabold">Ready for your next session?</p><p className="mt-1 text-xs text-ink-soft">Start with the essentials that fit your routine.</p></div><Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-ink hover:bg-brand-100" to="/"><ArrowRight size={14} aria-hidden="true" /> Browse the store</Link></section>
    </div>
  )
}

export default MemberDashboardPage
