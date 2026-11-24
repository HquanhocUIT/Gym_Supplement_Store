import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import useMemberQuery from '../../hooks/useMemberQuery';
import { accountButton, accountCard, dateLabel, money, orderStatusLabels } from './accountUi';
import AccountQueryState from './AccountQueryState';

// Đọc snapshot của đơn thay vì giá sản phẩm đang có thể thay đổi trong catalog.
export default function OrderDetailPage() {
  const { orderId } = useParams();
  const query = useMemberQuery(`/store/orders/${orderId}`);
  const order = query.data;
  return <div className="space-y-6">
    <Link className={accountButton} to="/member/orders"><ArrowLeft size={16} aria-hidden="true" /> Back to my orders</Link>
    <AccountQueryState query={query}>
      {order && <>
        <header><h1 className="font-display text-3xl font-extrabold">Order #{order.id}</h1><p className="mt-3 text-ink-soft">{dateLabel(order.created_at, true)}</p><p className="mt-3 font-semibold text-brand-700">{orderStatusLabels[order.status] || order.status}</p></header>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className={accountCard}><h2 className="text-xl font-bold">Items ordered</h2><ul className="mt-4 divide-y divide-line">{order.items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-4 py-4"><div><p className="font-bold">{item.product_name}</p><p className="mt-1 text-sm text-ink-soft">{item.variant_description} · Quantity {item.quantity}</p><p className="mt-1 text-sm text-ink-soft">{money(item.price)} each</p></div><p className="font-semibold">{money(Number(item.price) * item.quantity)}</p></li>)}</ul></section>
          <div className="space-y-6">
            <section className={accountCard}><h2 className="text-xl font-bold">Delivery address</h2><p className="mt-4 font-semibold">{order.recipient_name}</p><p className="mt-2 text-sm">{order.recipient_phone}</p><p className="mt-2 whitespace-pre-line text-sm leading-6">{order.shipping_address}</p></section>
            <section className={accountCard}><h2 className="text-xl font-bold">Order summary</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div className="flex justify-between gap-3"><dt>Member discount</dt><dd>−{money(order.discount_amount)}</dd></div><div className="flex justify-between gap-3 border-t border-line pt-3 font-bold"><dt>Total</dt><dd>{money(order.total_amount)}</dd></div></dl><p className="mt-4 text-sm text-ink-soft">{order.payment?.payment_method === 'cod' ? 'Cash on delivery' : 'Payment information unavailable'}{order.payment ? ` · ${order.payment.status === 'completed' ? 'Paid' : 'Awaiting payment'}` : ''}</p></section>
          </div>
        </div>
      </>}
    </AccountQueryState>
  </div>;
}
