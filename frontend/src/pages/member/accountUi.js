export const accountButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-bold transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700';
export const accountCard = 'min-w-0 rounded-card border border-line bg-white p-5 shadow-card sm:p-6';
export const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(Number(value || 0));

export function dateLabel(value, includeTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', ...(includeTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

// So ngày theo múi giờ Việt Nam để gói vẫn hiệu lực trong ngày hết hạn.
function dayKey(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(value));
}
export function membershipStatus(membership, today = new Date()) {
  if (membership.status !== 'active') return membership.status;
  if (dayKey(membership.start_date) > dayKey(today)) return 'upcoming';
  return dayKey(membership.end_date) < dayKey(today) ? 'expired' : 'active';
}
export const orderStatusLabels = {
  pending: 'Awaiting confirmation', confirmed: 'Confirmed', shipping: 'On the way',
  delivered: 'Delivered', cancelled: 'Cancelled',
};
