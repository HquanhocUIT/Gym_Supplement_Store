import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

/**
 * CheckInScreen - Staff page to check in a member.
 * POST /checkins with { user_id }.
 * GET /checkins/today to list today's check-ins.
 */
export default function CheckInScreen() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkins, setCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(true);

  // Only allow positive integer IDs before enabling the submit button.
  const numericUserId = Number(userId);
  const isUserIdValid =
    userId !== '' && Number.isInteger(numericUserId) && numericUserId > 0;

  async function handleCheckIn(e) {
    e.preventDefault();

    if (!isUserIdValid) {
      toast.error('Something went wrong. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post('/checkins', {
        user_id: numericUserId,
      });
      toast.success('Saved successfully.');
      setUserId('');
      // Refresh today's check-in list after a successful check-in
      await fetchTodayCheckins();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayCheckins() {
    setLoadingCheckins(true);
    try {
      const response = await axiosClient.get('/checkins/today');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setCheckins(response.data.data);
      }
    } catch {
      setCheckins([]);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingCheckins(false);
    }
  }

  // Load today's check-ins on mount (inside useEffect, not during render)
  useEffect(() => {
    fetchTodayCheckins();
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Check-in</h1>
            <p className="text-sm text-muted">Record member gym entry.</p>
          </div>
        </div>

        {/* Check-in Form */}
        <div className="mb-8 rounded-xl border border-[#e3e9e1] bg-white p-6 shadow-card">
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleCheckIn}>
            <div className="w-full space-y-2 md:max-w-xs">
              <label className="block text-sm font-semibold text-ink" htmlFor="checkin-user-id">
                User ID
              </label>
              <Input
                error={userId !== '' && !isUserIdValid}
                id="checkin-user-id"
                min={1}
                required
                type="number"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              {userId !== '' && !isUserIdValid && (
                <p className="text-xs text-red-600">User ID must be a positive integer.</p>
              )}
            </div>
            <div>
              <Button disabled={!isUserIdValid} loading={loading} type="submit">
                <Clock size={18} /> Check-in
              </Button>
            </div>
          </form>
        </div>

        {/* Today's Check-ins Table */}
        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-[#e3e9e1] px-6 py-4">
            <h2 className="text-lg font-bold text-ink">Today&apos;s Check-ins</h2>
            <span className="text-sm font-medium text-muted">{checkins.length} check-ins</span>
          </div>

          {loadingCheckins ? (
            <div className="space-y-3 p-5" aria-label="Loading check-ins">
              {[0, 1, 2].map((item) => (
                <Skeleton className="h-10 w-full" key={item} />
              ))}
            </div>
          ) : checkins.length === 0 ? (
            <EmptyState
              description="Check-ins for today will appear here."
              icon={CheckCircle}
              title="No data yet"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e3e9e1] bg-[#f4f6f3]">
                    <th className="px-4 py-3 text-sm font-semibold text-muted">User ID</th>
                    <th className="px-4 py-3 text-sm font-semibold text-muted">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e9e1]">
                  {checkins.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[#f4f6f3]/50">
                      <td className="px-4 py-3 text-sm text-ink">{c.user_id}</td>
                      <td className="px-4 py-3 text-sm text-muted">{c.checkin_time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
