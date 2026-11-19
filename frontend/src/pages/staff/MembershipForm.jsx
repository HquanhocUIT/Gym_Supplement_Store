import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { User, Shield, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

/**
 * MembershipForm - Staff page to renew a member's plan.
 * GET /plans to load available plans.
 * POST /members/:id/memberships to create a membership.
 */
export default function MembershipForm() {
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const response = await axiosClient.get('/plans');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setPlans(response.data.data);
      }
    } catch {
      setPlans([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      await axiosClient.post(`/members/${Number(memberId)}/memberships`, {
        plan_id: Number(planId),
        start_date: startDate,
      });
      setResult({
        type: 'success',
        message: 'Membership renewed successfully.',
      });
    } catch (err) {
      setResult({
        type: 'error',
        message: err.message || 'Failed to renew membership.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Renew Membership</h1>
          <p className="text-sm text-muted">Renew a member's gym membership plan.</p>
        </div>

        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-ink">Member ID</label>
                <Input
                  type="number"
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-ink">Plan</label>
                <select
                  required
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#3a4a3e] rounded-lg text-sm bg-white text-ink focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                >
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.duration_days} days - {p.price.toLocaleString('vi-VN')} VND
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-ink">Start Date</label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {result && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                result.type === 'success'
                  ? 'bg-[#9aca42]/10 border border-[#9aca42]/30 text-[#9aca42]'
                  : 'bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444]'
              }`}>
                {result.type === 'success' ? <Shield size={20} /> : <Clock size={20} />}
                <span className="text-sm font-medium">{result.message}</span>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" loading={loading}>
                <User size={18} /> Confirm Renewal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
