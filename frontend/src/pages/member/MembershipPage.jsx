import { CalendarDays, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import useMemberQuery from '../../hooks/useMemberQuery';
import EmptyState from '../../components/common/EmptyState';
import { accountButton, accountCard, dateLabel, membershipStatus, money } from './accountUi';
import AccountQueryState from './AccountQueryState';

// Hiển thị gói đã đăng ký và lịch sử check-in thật; không dựng lịch tập giả.
export default function MembershipPage() {
  const memberships = useMemberQuery('/me/memberships');
  const checkins = useMemberQuery('/me/checkins');
  return <div className="space-y-7">
    <header><h1 className="font-display text-3xl font-extrabold">My plan</h1><p className="mt-3 text-ink-soft">Your gym memberships, validity dates and check-in history.</p></header>
    <AccountQueryState query={memberships}>
      {memberships.data?.length ? <section aria-label="My memberships" className="grid gap-4 md:grid-cols-2">
        {memberships.data.map((membership) => <article key={membership.id} className={accountCard}>
          <div className="flex flex-wrap items-center justify-between gap-3"><ShieldCheck className="text-brand-700" aria-hidden="true" /><span className="rounded-full bg-paper px-3 py-2 text-sm font-semibold capitalize">{membershipStatus(membership)}</span></div>
          <h2 className="mt-4 text-xl font-bold">{membership.plan_name}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-ink-soft">Start date</dt><dd>{dateLabel(membership.start_date)}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-ink-soft">End date</dt><dd>{dateLabel(membership.end_date)}</dd></div>
            <div className="flex flex-wrap justify-between gap-2"><dt className="text-ink-soft">Plan price</dt><dd>{money(membership.price)}</dd></div>
          </dl>
        </article>)}
      </section> : <section className={accountCard}><EmptyState icon={ShieldCheck} title="No membership yet" description="Browse the available plans, then contact reception to register or renew." action={<Link className={accountButton} to="/pricing">Browse membership plans</Link>} /></section>}
    </AccountQueryState>
    <section><h2 className="mb-4 text-xl font-bold">Check-in history</h2>
      <AccountQueryState query={checkins}>
        <div className={accountCard}>{checkins.data?.length
          ? <ul className="divide-y divide-line">{checkins.data.map((visit) => <li className="flex items-center gap-3 py-4 text-sm" key={visit.id}><CalendarDays className="shrink-0 text-brand-700" size={20} aria-hidden="true" /><time dateTime={visit.checkin_time}>{dateLabel(visit.checkin_time, true)}</time></li>)}</ul>
          : <EmptyState icon={CalendarDays} title="No visits recorded" description="Your visits will appear here after reception checks you in." />}</div>
      </AccountQueryState>
    </section>
  </div>;
}
