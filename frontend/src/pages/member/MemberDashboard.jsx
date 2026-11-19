import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Shield, Clock } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, []);

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
      // Keep empty states
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getActiveMembership = () => {
    const now = new Date();
    return memberships.find(
      (m) => m.status === 'active' && new Date(m.end_date) >= now
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84cc16]"></div>
      </div>
    );
  }

  const active = getActiveMembership();

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">My Dashboard</h1>
          <p className="text-sm text-muted">
            Welcome back, {user?.full_name || 'Member'}.
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Shield size={32} className="text-[#9aca42]" />
            <div>
              <h2 className="text-lg font-bold text-ink">Current Membership</h2>
              <p className="text-sm text-muted">{active ? active.plan_name : 'No active plan'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-[#e3e9e1] pt-4">
            <div className="text-center">
              <p className="text-sm text-muted">Start Date</p>
              <p className="text-sm font-semibold text-ink">{active ? formatDate(active.start_date) : '-'}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted">Expiry Date</p>
              <p className={`text-sm font-semibold ${active ? 'text-[#9aca42]' : 'text-[#ef4444]'}`}>
                {active ? formatDate(active.end_date) : 'N/A'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted">Status</p>
              <span className={`text-sm font-semibold ${active ? 'text-[#9aca42]' : 'text-[#ef4444]'}`}>
                {active ? active.status.toUpperCase() : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Check-in History */}
        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          <div className="px-6 py-4 border-b border-[#e3e9e1]">
            <h2 className="text-lg font-bold text-ink">Check-in History</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e3e9e1] bg-[#f4f6f3]">
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e9e1]">
                {checkins.length === 0 ? (
                  <tr>
                    <td colSpan={1} className="px-4 py-8 text-center text-muted">No check-ins yet.</td>
                  </tr>
                ) : (
                  checkins.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f4f6f3]/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-ink">{c.checkin_time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
