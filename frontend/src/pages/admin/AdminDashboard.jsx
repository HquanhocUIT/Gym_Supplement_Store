import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Eyebrow } from '../../components/Brand.jsx';
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CircleDollarSign,
  Clock,
  PackageX,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Mock data keeps the dashboard usable when the /admin/stats endpoint
 * is not deployed yet or the request fails. Replace once the API lands.
 */
const MOCK_STATS = {
  revenueToday: 4850000,
  activeMembers: 128,
  expiringPlans: [
    { id: 1, memberName: 'Nguyen Van An', planName: '3 Month Pass', endDate: '2026-11-24', daysLeft: 3 },
    { id: 2, memberName: 'Tran Thi Binh', planName: '1 Month Pass', endDate: '2026-11-26', daysLeft: 5 },
    { id: 3, memberName: 'Le Minh Cuong', planName: '6 Month Pass', endDate: '2026-11-29', daysLeft: 8 },
    { id: 4, memberName: 'Pham Thu Dung', planName: '1 Month Pass', endDate: '2026-12-01', daysLeft: 10 },
  ],
  lowStockProducts: [
    { id: 1, name: 'Whey Protein Isolate', stock: 4, threshold: 10 },
    { id: 2, name: 'Creatine Monohydrate', stock: 7, threshold: 15 },
    { id: 3, name: 'Pre-Workout Fuel', stock: 12, threshold: 20 },
  ],
  revenue7Days: [
    { day: 'Mon', revenue: 3200000 },
    { day: 'Tue', revenue: 4100000 },
    { day: 'Wed', revenue: 2850000 },
    { day: 'Thu', revenue: 5200000 },
    { day: 'Fri', revenue: 6100000 },
    { day: 'Sat', revenue: 7400000 },
    { day: 'Sun', revenue: 4850000 },
  ],
};

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('vi-VN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
}

/**
 * Accepts a few common response shapes so the page works with the API
 * regardless of whether it uses camelCase or snake_case keys.
 */
function normalizeStats(payload) {
  if (!payload || typeof payload !== 'object') return MOCK_STATS;

  const revenue7Days =
    payload.revenue7Days || payload.revenue_7_days || payload.revenueChart || payload.revenue_chart;

  return {
    revenueToday:
      payload.revenueToday ?? payload.todayRevenue ?? payload.revenue_today ?? MOCK_STATS.revenueToday,
    activeMembers:
      payload.activeMembers ?? payload.active_members ?? MOCK_STATS.activeMembers,
    expiringPlans: Array.isArray(payload.expiringPlans)
      ? payload.expiringPlans
      : Array.isArray(payload.expiring_plans)
        ? payload.expiring_plans
        : MOCK_STATS.expiringPlans,
    lowStockProducts: Array.isArray(payload.lowStockProducts)
      ? payload.lowStockProducts
      : Array.isArray(payload.low_stock_products)
        ? payload.low_stock_products
        : MOCK_STATS.lowStockProducts,
    revenue7Days:
      Array.isArray(revenue7Days) && revenue7Days.length > 0
        ? revenue7Days.map((item) => ({
            day: item.day || item.label || formatDate(item.date),
            revenue: Number(item.revenue ?? item.total ?? 0),
          }))
        : MOCK_STATS.revenue7Days,
  };
}

function KpiCard({ label, value, hint, icon: Icon, accent }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-brand-500/25 bg-[#101b15] p-5 shadow-[0_0_28px_rgba(154,202,66,0.08)] transition hover:border-brand-500/60 hover:shadow-[0_0_34px_rgba(154,202,66,0.18)]">
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-35"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">{label}</p>
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-500"
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-[28px]">
        {value}
      </p>
      <p className="mt-1 text-xs text-white/40">{hint}</p>
    </article>
  );
}

function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-brand-500/20 bg-[#101b15] shadow-[0_0_30px_rgba(0,0,0,0.35)] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-base font-extrabold text-white">{title}</h2>
          {description ? <p className="mt-1 text-xs text-white/40">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-brand-500/40 bg-[#0a120d] px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-white/70">{label}</p>
      <p className="mt-1 font-display text-sm font-extrabold text-brand-500">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function EmptyRow({ colSpan, message }) {
  return (
    <tr>
      <td className="px-5 py-10 text-center text-sm text-white/40 sm:px-6" colSpan={colSpan}>
        {message}
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setLoading(true);
      try {
        const response = await axiosClient.get('/admin/stats');
        if (cancelled) return;
        setStats(normalizeStats(response.data?.data ?? response.data));
        setIsDemo(false);
      } catch {
        if (cancelled) return;
        setStats(MOCK_STATS);
        setIsDemo(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const kpis = useMemo(() => {
    const data = stats || MOCK_STATS;

    return [
      {
        label: 'Revenue today',
        value: formatCurrency(data.revenueToday),
        hint: 'Paid orders and renewals today',
        icon: CircleDollarSign,
        accent: '#9aca42',
      },
      {
        label: 'Active members',
        value: new Intl.NumberFormat('vi-VN').format(data.activeMembers),
        hint: 'Memberships currently valid',
        icon: Users,
        accent: '#38bdf8',
      },
      {
        label: 'Expiring soon',
        value: new Intl.NumberFormat('vi-VN').format(data.expiringPlans.length),
        hint: 'Plans ending within 14 days',
        icon: CalendarClock,
        accent: '#fbbf24',
      },
      {
        label: 'Low stock',
        value: new Intl.NumberFormat('vi-VN').format(data.lowStockProducts.length),
        hint: 'Products below reorder level',
        icon: PackageX,
        accent: '#f87171',
      },
    ];
  }, [stats]);

  const data = stats || MOCK_STATS;

  return (
    <div className="-mx-4 -my-7 min-h-screen bg-[#0a120d] px-4 py-7 sm:-mx-6 sm:px-6 sm:py-9 lg:-mx-9 lg:px-9 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow dark>Admin analytics</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">
            Gym performance
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Revenue, membership health and inventory at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDemo ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300">
              <AlertTriangle size={13} aria-hidden="true" />
              Demo data
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-bold text-brand-500">
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              Live data
            </span>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-brand-500/30 px-3 py-2 text-xs font-bold text-brand-500 transition hover:border-brand-500/70 hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={14} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading metrics">
          {[0, 1, 2, 3].map((item) => (
            <div
              className="h-36 animate-pulse rounded-2xl border border-brand-500/20 bg-[#101b15]"
              key={item}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <SectionCard
          title="Revenue · last 7 days"
          description="Daily revenue from memberships and store orders."
          action={
            <span className="inline-flex items-center gap-1 rounded-lg border border-brand-500/25 px-3 py-1.5 text-[11px] font-bold text-white/50">
              <ArrowUpRight size={13} aria-hidden="true" />
              VND
            </span>
          }
        >
          <div className="h-72 w-full px-2 py-4 sm:px-4">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data.revenue7Days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revenueBar" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#9aca42" stopOpacity={1} />
                    <stop offset="100%" stopColor="#9aca42" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff" strokeDasharray="4 6" strokeOpacity={0.07} vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  tickFormatter={(value) => compactFormatter.format(value)}
                  tickLine={false}
                  width={54}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(154,202,66,0.08)' }} />
                <Bar dataKey="revenue" fill="url(#revenueBar)" maxBarSize={44} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Plans expiring soon"
          description="Memberships that need a renewal follow-up."
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
              <Clock size={12} aria-hidden="true" />
              {data.expiringPlans.length} members
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Member</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Ends on</th>
                  <th className="px-5 py-3 text-right sm:px-6">Days left</th>
                </tr>
              </thead>
              <tbody>
                {data.expiringPlans.length === 0 ? (
                  <EmptyRow colSpan={4} message="No memberships expiring soon." />
                ) : (
                  data.expiringPlans.map((plan) => {
                    const daysLeft = Number(plan.daysLeft ?? plan.days_left ?? 0);
                    return (
                      <tr className="border-t border-white/8" key={plan.id ?? plan.memberName}>
                        <td className="px-5 py-3.5 font-semibold text-white/85 sm:px-6">
                          {plan.memberName || plan.member_name || plan.name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-white/50">
                          {plan.planName || plan.plan_name || plan.plan || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-white/50">
                          {formatDate(plan.endDate || plan.end_date)}
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                              daysLeft <= 3
                                ? 'border-red-400/30 bg-red-400/10 text-red-300'
                                : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                            }`}
                          >
                            {daysLeft} days
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Low stock products"
          description="Restock these items before they run out."
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/10 px-2.5 py-1 text-[10px] font-bold text-red-300">
              <AlertTriangle size={12} aria-hidden="true" />
              {data.lowStockProducts.length} items
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-white/35">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Product</th>
                  <th className="px-5 py-3">In stock</th>
                  <th className="px-5 py-3">Reorder level</th>
                  <th className="px-5 py-3 text-right sm:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.length === 0 ? (
                  <EmptyRow colSpan={4} message="Inventory levels are healthy." />
                ) : (
                  data.lowStockProducts.map((product) => {
                    const stock = Number(product.stock ?? product.quantity ?? 0);
                    const threshold = Number(product.threshold ?? product.reorderLevel ?? 0);
                    return (
                      <tr className="border-t border-white/8" key={product.id ?? product.name}>
                        <td className="px-5 py-3.5 font-semibold text-white/85 sm:px-6">
                          {product.name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-white/50">{stock}</td>
                        <td className="px-5 py-3.5 text-white/50">{threshold || '—'}</td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                              stock === 0
                                ? 'border-red-400/30 bg-red-400/10 text-red-300'
                                : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                            }`}
                          >
                            {stock === 0 ? 'Out of stock' : 'Low stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
