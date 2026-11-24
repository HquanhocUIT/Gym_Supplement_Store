import { ArrowRight, PackageSearch } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import useMemberQuery from '../../hooks/useMemberQuery';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { accountButton, accountCard, dateLabel, money, orderStatusLabels } from './accountUi';
import AccountQueryState from './AccountQueryState';

// Danh sách được backend giới hạn theo tài khoản trong token, không truyền user_id.
export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  function setPage(value) {
    if (value === page) return;
    const next = new URLSearchParams(params);
    if (value === 1) next.delete('page');
    else next.set('page', String(value));
    setParams(next);
  }
  const query = useMemberQuery('/store/orders', { page, limit: 12 });
  const orders = query.data?.items || [];
  const pagination = query.data?.pagination;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-extrabold">My orders</h1><p className="mt-3 text-ink-soft">Follow your purchases and view delivery details.</p></div><Link className={accountButton} to="/shop">Continue shopping <ArrowRight size={16} aria-hidden="true" /></Link></header>
    <AccountQueryState query={query}>
      {orders.length ? <section aria-label="Order history" className="space-y-4">
        {orders.map((order) => <article key={order.id} className={accountCard}>
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Order #{order.id}</h2><p className="mt-2 text-sm text-ink-soft">{dateLabel(order.created_at, true)} · {order.item_count} items</p></div><span className="rounded-full bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">{orderStatusLabels[order.status] || order.status}</span></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4"><p className="font-bold">{money(order.total_amount)}</p><Link className={accountButton} to={`/member/orders/${order.id}`} state={{ returnTo: location.pathname + location.search }}>View order #{order.id} <ArrowRight size={16} aria-hidden="true" /></Link></div>
        </article>)}
        {pagination && <div className={accountCard}><Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={setPage} disabled={query.isFetching} /></div>}
      </section> : <section className={accountCard}><EmptyState icon={PackageSearch} title="No orders yet" description="Your orders will appear here after checkout." action={<Link className={accountButton} to="/shop">Browse products</Link>} /></section>}
    </AccountQueryState>
  </div>;
}
