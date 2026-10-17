import { Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BrandMark({ light = false }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-4 ${light ? 'text-white' : 'text-ink'}`}
      aria-label="Form and Fuel home"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-brand-500 text-ink">
        <Dumbbell size={21} strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="font-display text-[15px] font-extrabold leading-none tracking-[-0.04em]">
        FORM <span className={light ? 'text-brand-500' : 'text-brand-700'}>&amp;</span> FUEL
      </span>
    </Link>
  )
}

export function Eyebrow({ children, dark = false }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.17em] ${dark ? 'text-brand-500' : 'text-brand-700'}`}>
      {children}
    </p>
  )
}
