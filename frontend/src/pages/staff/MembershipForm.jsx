import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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

  async function fetchPlans() {
    try {
      const response = await axiosClient.get('/plans');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setPlans(response.data.data);
      }
    } catch {
      setPlans([]);
      toast.error('Có lỗi xảy ra!');
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  const numericMemberId = Number(memberId);
  const isMemberIdValid =
    memberId !== '' && Number.isInteger(numericMemberId) && numericMemberId > 0;
  const isFormValid = isMemberIdValid && planId !== '' && startDate !== '';

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isFormValid) {
      toast.error('Có lỗi xảy ra!');
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post(`/members/${numericMemberId}/memberships`, {
        plan_id: Number(planId),
        start_date: startDate,
      });
      toast.success('Thành công!');
      setPlanId('');
      setStartDate('');
    } catch {
      toast.error('Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Renew Membership</h1>
          <p className="text-sm text-muted">Renew a member&apos;s gym membership plan.</p>
        </div>

        <div className="max-w-2xl rounded-xl border border-[#e3e9e1] bg-white p-6 shadow-card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="w-full space-y-2 md:flex-1">
                <label className="block text-sm font-semibold text-ink" htmlFor="renew-member-id">
                  Member ID
                </label>
                <Input
                  error={memberId !== '' && !isMemberIdValid}
                  id="renew-member-id"
                  min={1}
                  required
                  type="number"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                />
              </div>

              <div className="w-full space-y-2 md:flex-1">
                <label className="block text-sm font-semibold text-ink" htmlFor="renew-plan">
                  Plan
                </label>
                <select
                  required
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full rounded-lg border border-[#3a4a3e] bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#84cc16]"
                  id="renew-plan"
                >
                  <option value="">Select a plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.duration_days} days - {p.price.toLocaleString('vi-VN')} VND
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full space-y-2 md:flex-1">
                <label className="block text-sm font-semibold text-ink" htmlFor="renew-start-date">
                  Start Date
                </label>
                <Input
                  id="renew-start-date"
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {!isFormValid && (
              <p className="text-xs text-red-600">
                Vui lòng nhập Member ID hợp lệ, chọn gói tập và ngày bắt đầu.
              </p>
            )}

            <div className="flex justify-end pt-4">
              <Button disabled={!isFormValid} loading={loading} type="submit">
                <User size={18} /> Confirm Renewal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
