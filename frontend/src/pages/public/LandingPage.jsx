import { ArrowRight, Dumbbell, UserRoundCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

// Trang chủ giữ cùng kiểu chữ, màu và icon với các trang Store.
const features = [
  { icon: Dumbbell, title: 'Equipment for every session', description: 'Build a balanced routine with equipment for strength, mobility and conditioning.' },
  { icon: UserRoundCheck, title: 'Support for your training', description: 'Find the guidance and membership plan that fit your experience and goals.' },
  { icon: Smartphone, title: 'Membership made simple', description: 'Explore plans online and keep your membership and check-in history in one place.' },
];

export default function LandingPage() {
  return (
    <div className="bg-paper text-ink">
      {/* Nền tối dùng chữ sáng; hành động chính dẫn tới gói tập. */}
      <section className="bg-night px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-6xl">
            Build strength.<br className="hidden sm:block" /> Find your routine.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            Flexible gym memberships, purposeful training and supplements that support your goals.
          </p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-7 py-3 text-sm font-bold text-ink transition hover:bg-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Explore memberships <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Browse the store
            </Link>
          </div>
        </div>
      </section>

      {/* Icon nét đồng nhất và khoảng cách rộng giúp nội dung dễ đọc trên điện thoại. */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="why-title">
        <h2 id="why-title" className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Why train with Form &amp; Fuel?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3 lg:mt-12 lg:gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-card border border-line bg-white px-7 py-9 shadow-card sm:px-8 sm:py-10">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-6 font-display text-xl font-bold leading-7">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink-soft">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">Ready for your next session?</h2>
          <p className="mt-4 text-base leading-7 text-ink-soft">Create an account to manage your membership and shop for your training essentials.</p>
          <Link to="/register" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700">
            Create an account <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
