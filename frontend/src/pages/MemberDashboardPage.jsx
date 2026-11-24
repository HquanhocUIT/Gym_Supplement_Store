import { ArrowRight, CalendarDays, PackageCheck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useMemberQuery from '../hooks/useMemberQuery';
import { accountButton, accountCard, dateLabel, membershipStatus } from './member/accountUi';
import AccountQueryState from './member/AccountQueryState';

// Tổng quan chỉ hiển thị thông tin của người đang đăng nhập, không dùng tài khoản mẫu.
export default function MemberDashboardPage() {
  const { user } = useAuth();
  const profile = useMemberQuery('/me/profile');
  const memberships = useMemberQuery('/me/memberships');
  const orders = useMemberQuery('/store/orders', { page: 1, limit: 1 });
  const current = memberships.data?.find((item) => membershipStatus(item) === 'active');
  return <div className="space-y-6">
    <header className="rounded-card bg-night px-6 py-8 text-white sm:p-9">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Your account</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Welcome, {profile.data?.full_name || user?.full_name || 'member'}.</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-white/85">Manage your gym membership and follow your store orders in one place.</p>
      <Link className={`${accountButton} mt-5 border-transparent bg-brand-500 text-ink`} to="/shop">Shop supplements <ArrowRight size={17} aria-hidden="true" /></Link>
    </header>
    {profile.isError && <AccountQueryState query={profile} />}
    <div className="grid gap-6 md:grid-cols-2">
      <AccountQueryState query={memberships}>
        <section className={accountCard}>
          <ShieldCheck className="text-brand-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">My membership</h2>
          <p className="mt-3 text-lg font-semibold">{current?.plan_name || 'No active membership'}</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{current ? `Valid until ${dateLabel(current.end_date)}.` : 'Choose a membership plan and contact reception to get started.'}</p>
          <Link className={`${accountButton} mt-5`} to="/member/plan">View my plan <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </AccountQueryState>
      <AccountQueryState query={orders}>
        <section className={accountCard}>
          <PackageCheck className="text-brand-700" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">My orders</h2>
          <p className="mt-3 text-lg font-semibold">{orders.data?.pagination.total || 0} orders placed</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{orders.data?.pagination.total ? 'View your order details, delivery address and current status.' : 'Your purchases will appear here after you place an order.'}</p>
          <Link className={`${accountButton} mt-5`} to="/member/orders">View my orders <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </AccountQueryState>
    </div>
    <section className={`${accountCard} flex flex-wrap items-center justify-between gap-4`}>
      <div><CalendarDays className="mb-3 text-brand-700" aria-hidden="true" /><h2 className="font-bold">Membership plans &amp; check-ins</h2><p className="mt-2 text-sm text-ink-soft">See your membership dates and your visits to the gym.</p></div>
      <Link className={accountButton} to="/member/plan">Open membership details</Link>
    </section>
  </div>;
}
