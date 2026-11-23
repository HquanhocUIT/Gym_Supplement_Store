import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import { Clock, Flame, Check, DollarSign } from 'lucide-react';

/**
 * PricingPage - Gym membership pricing page.
 * Calls GET /plans API, uses mock data if API fails.
 * Displays plans as Pricing Cards.
 */
const MOCK_PLANS = [
  {
    id: 1,
    name: '1 Month Pass',
    duration_days: 30,
    price: 250000,
    status: 'active',
    features: ['Gym 24/7 access', 'Group classes', 'Body consultation'],
  },
  {
    id: 2,
    name: '3 Month Pass',
    duration_days: 90,
    price: 690000,
    status: 'active',
    features: ['Gym 24/7 access', 'Group classes', 'Body consultation', 'Body assessment'],
  },
  {
    id: 3,
    name: '6 Month Pass',
    duration_days: 180,
    price: 1290000,
    status: 'active',
    features: [
      'Gym 24/7 access',
      'Group classes',
      'Body consultation',
      'Body assessment',
      'Sports nutrition',
    ],
  },
  {
    id: 4,
    name: '1 Year Pass',
    duration_days: 365,
    price: 2390000,
    status: 'active',
    features: [
      'Gym 24/7 access',
      'Group classes',
      'Body consultation',
      'Body assessment',
      'Sports nutrition',
      'Personal locker',
    ],
  },
];

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await axiosClient.get('/plans');
        if (response.data?.data && Array.isArray(response.data.data)) {
          setPlans(response.data.data);
        } else {
          setPlans(MOCK_PLANS);
        }
      } catch {
        setPlans(MOCK_PLANS);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const formatDuration = (days) => {
    if (days >= 365) return '1 year';
    if (days >= 180) return '6 months';
    if (days >= 90) return '3 months';
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9aca42]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night text-ink">
      {/* Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-bold text-white">Choose Your Membership Plan</h1>
              <p className="text-muted mt-2">All plans include 24/7 gym access and basic amenities.</p>
            </div>
            <Link to="/register" className="px-6 py-3 border border-[#9aca42] rounded-xl text-[#9aca42] font-bold hover:bg-[#9aca42] hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} formatPrice={formatPrice} formatDuration={formatDuration} />
            ))}
          </div>
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
  const isPopular = plan.id === 3; // 6 Month Pass is most popular

  return (
    <div className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${isPopular ? 'border-[#9aca42] bg-[#22332b]/50 shadow-[0_0_30px_rgba(138,202,66,0.15)]' : 'border-[#3a4a3e] bg-[#22332b] hover:border-[#6a8a66]'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#9aca42] text-white text-xs font-bold">
          MOST POPULAR
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <p className="text-muted text-sm mb-6">{formatDuration(plan.duration_days)}</p>

        <div className="mb-8">
          <span className="text-4xl font-extrabold text-white">{formatPrice(plan.price).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}</span>
          <span className="text-sm text-muted ml-2">/month</span>
        </div>

        <ul className="space-y-3 mb-8 text-sm text-muted">
          {(plan.features || []).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="w-4 h-4 text-[#9aca42] shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <Link to="/register" className={`w-full py-4 px-6 rounded-xl font-bold transition-colors ${isPopular ? 'bg-[#9aca42] text-white hover:bg-[#7cac2c]' : 'border border-[#3a4a3e] text-white hover:bg-[#2a3a32]'}`}>
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
      <p className="text-sm text-muted">{answer}</p>
    </div>
  );
}
