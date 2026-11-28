import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import useApiQuery from '../../hooks/useApiQuery';

export default function PricingPage() {
  const plansQuery = useApiQuery({
    queryKey: ['membership-plans'],
    url: '/plans',
    retry: false,
    select: (data) => {
      if (!Array.isArray(data)) throw new Error('The server returned an unexpected plan list.');
      return data;
    },
  });
  const plans = plansQuery.data || [];

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const formatDuration = (days) => {
    if (days === 365) return '1 year';
    if (days >= 30 && days % 30 === 0) return `${days / 30} ${days === 30 ? 'month' : 'months'}`;
    return `${days} days`;
  };

  return (
    <div className="min-h-screen bg-night text-ink">
      {/* Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Choose Your Membership Plan</h1>
              <p className="text-slate-300 mt-2">Choose the membership duration that fits your training routine.</p>
            </div>
            <Link to="/register" className="px-6 py-3 border border-[#9aca42] rounded-xl text-[#9aca42] font-bold hover:bg-[#9aca42] hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {plansQuery.isPending ? (
            <p className="py-12 text-center text-slate-200" role="status">Loading membership plans...</p>
          ) : plansQuery.isError ? (
            <div className="rounded-2xl border border-white/20 p-8 text-center text-white" role="alert">
              <h2 className="text-xl font-bold">Unable to load membership plans</h2>
              <p className="mt-3 text-slate-200">{plansQuery.error.message}</p>
              <button type="button" className="mt-5 min-h-11 rounded-xl bg-brand-500 px-6 font-bold text-ink disabled:opacity-60" onClick={() => plansQuery.refetch()} disabled={plansQuery.isFetching}>Try again</button>
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-white/20 p-8 text-center text-white" role="status">
              <h2 className="text-xl font-bold">No membership plans available yet</h2>
              <p className="mt-3 text-slate-200">Please check back soon or contact the gym for membership options.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <PricingCard key={plan.id} plan={plan} formatPrice={formatPrice} formatDuration={formatDuration} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#18251f]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FaqItem
              question="Can I change my plan after registering?"
              answer="Yes, you can upgrade your plan anytime. You only need to pay the price difference between the two plans."
            />
            <FaqItem
              question="Is there a one-time registration fee?"
              answer="No, we do not charge registration fees. You only pay for the plan you choose."
            />
            <FaqItem
              question="When can I cancel my plan?"
              answer="You can cancel your plan before the renewal date. Paid fees are not refundable but you can use until expiration."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ plan, formatPrice, formatDuration }) {

  return (
    <div className="relative flex min-w-0 flex-col rounded-2xl border border-[#3a4a3e] bg-[#22332b] p-6 transition-colors hover:border-[#6a8a66]">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-slate-300 text-sm mb-6">{formatDuration(plan.duration_days)}</p>

        <div className="mb-8">
          <p className="whitespace-nowrap text-3xl font-extrabold text-white">{formatPrice(plan.price)}</p>
          <p className="mt-2 text-sm text-slate-300">Total for {formatDuration(plan.duration_days)}</p>
        </div>

        <ul className="space-y-3 mb-8 text-sm text-slate-300">
          {(plan.features || []).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#9aca42] shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <Link to="/register" className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#6a8a66] px-4 py-3 font-bold text-white transition-colors hover:bg-[#2a3a32]">
          Register Now
        </Link>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="p-4 rounded-xl border border-[#3a4a3e] bg-[#22332b] text-left">
      <h4 className="font-bold text-white mb-2">{question}</h4>
      <p className="text-sm text-slate-300">{answer}</p>
    </div>
  );
}
