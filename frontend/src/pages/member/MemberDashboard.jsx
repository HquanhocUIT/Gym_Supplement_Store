import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import { CalendarClock, Shield } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

/**
 * MemberDashboard - Member portal page.
 * GET /me/profile to get current member info.
 * GET /me/memberships to get member's plans.
 * GET /me/checkins to get check-in history.
 */
export default function MemberDashboard() {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [profileRes, membershipsRes, checkinsRes] = await Promise.all([
        axiosClient.get('/me/profile'),
        axiosClient.get('/me/memberships'),
        axiosClient.get('/me/checkins'),
      ]);

      if (profileRes.data?.data) setUser(profileRes.data.data);
      if (membershipsRes.data?.data && Array.isArray(membershipsRes.data.data))
        setMemberships(membershipsRes.data.data);
      if (checkinsRes.data?.data && Array.isArray(checkinsRes.data.data))
        setCheckins(checkinsRes.data.data);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  const getActiveMembership = () => {
    const now = new Date();
    return memberships.find(
      (m) => m.status === 'active' && new Date(m.end_date) >= now
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f3]">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8" aria-label="Loading dashboard">
          <Skeleton className="h-8 w-48" />
          <div className="rounded-xl border border-[#e3e9e1] bg-white p-6 shadow-card">
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="rounded-xl border border-[#e3e9e1] bg-white p-6 shadow-card">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const active = getActiveMembership();

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">My Dashboard</h1>
            <p className="text-sm text-muted">
              Welcome back, {user?.full_name || 'Member'}.
            </p>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="mb-8 rounded-xl border border-[#e3e9e1] bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center gap-4">
            <Shield size={32} className="text-[#9aca42]" />
            <div>
              <h2 className="text-lg font-bold text-ink">Current Membership</h2>
              <p className="text-sm text-muted">{active ? active.plan_name : 'No data yet'}</p>
            </div>
          </div>

          {active ? (
            <div className="grid grid-cols-1 gap-4 border-t border-[#e3e9e1] pt-4 sm:grid-cols-3">
              <div className="text-center">
                <p className="text-sm text-muted">Start Date</p>
                <p className="text-sm font-semibold text-ink">{formatDate(active.start_date)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted">Expiry Date</p>
                <p className="text-sm font-semibold text-[#9aca42]">{formatDate(active.end_date)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted">Status</p>
                <span className="text-sm font-semibold text-[#9aca42]">
                  {active.status.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="border-t border-[#e3e9e1] pt-2">
              <EmptyState
                description="You have no active membership. Contact reception to renew."
                icon={Shield}
                title="No data yet"
              />
            </div>
          )}
        </div>

        {/* Check-in History */}
        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          <div className="border-b border-[#e3e9e1] px-6 py-4">
            <h2 className="text-lg font-bold text-ink">Check-in History</h2>
          </div>

          {checkins.length === 0 ? (
            <EmptyState
              description="Your check-in history will appear here."
              icon={CalendarClock}
              title="No data yet"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e3e9e1] bg-[#f4f6f3]">
                    <th className="px-4 py-3 text-sm font-semibold text-muted">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e9e1]">
                  {checkins.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[#f4f6f3]/50">
                      <td className="px-4 py-3 text-sm text-ink">{c.checkin_time}</td>
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
