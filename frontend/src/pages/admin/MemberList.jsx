import { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { Search, User, Clock, Shield } from 'lucide-react';
import Input from '../../components/ui/Input';

/**
 * MemberList - Admin page to manage members.
 * Calls GET /members to list members.
 * Includes search by name or email.
 * Uses mock data fallback if API fails.
 */
const MOCK_MEMBERS = [
  { id: 1, email: 'member@example.com', full_name: 'Nguyen Van A', plan_name: '3 Month Pass', start_date: '2026-10-15', end_date: '2027-01-15', status: 'active' },
  { id: 2, email: 'member2@example.com', full_name: 'Tran Thi B', plan_name: '6 Month Pass', start_date: '2026-09-01', end_date: '2027-03-01', status: 'active' },
  { id: 3, email: 'member3@example.com', full_name: 'Le Van C', plan_name: '1 Year Pass', start_date: '2026-06-01', end_date: '2027-06-01', status: 'active' },
  { id: 4, email: 'member4@example.com', full_name: 'Pham Thi D', plan_name: '1 Month Pass', start_date: '2026-09-01', end_date: '2026-09-30', status: 'expired' },
  { id: 5, email: 'member5@example.com', full_name: 'Hoang Van E', plan_name: '3 Month Pass', start_date: '2026-10-01', end_date: '2026-12-31', status: 'active' },
];

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const response = await axiosClient.get('/members');
      if (response.data?.data && Array.isArray(response.data.data)) {
        setMembers(response.data.data);
      } else {
        setMembers(MOCK_MEMBERS);
      }
    } catch {
      setMembers(MOCK_MEMBERS);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const statusBadge = (status) => {
    const variants = {
      active: 'bg-[#9aca42]/10 text-[#9aca42]',
      expired: 'bg-[#ef4444]/10 text-[#ef4444]',
      cancelled: 'bg-[#6a8a66]/10 text-[#6a8a66]',
      pending: 'bg-[#d97706]/10 text-[#d97706]',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[status] || 'bg-[#6a8a66]/10 text-[#6a8a66]'}`}>
        <Shield size={12} />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#84cc16]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink">Members</h1>
            <p className="text-sm text-muted">Manage gym members and their membership plans.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          <div className="overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e3e9e1] bg-[#f4f6f3]">
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Email</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Current Plan</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Start Date</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Expiry Date</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e9e1]">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">No members found.</td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-[#f4f6f3]/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-ink font-medium">{m.full_name}</td>
                      <td className="px-4 py-3 text-sm text-muted">{m.email}</td>
                      <td className="px-4 py-3 text-sm text-ink">{m.plan_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDate(m.start_date)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDate(m.end_date)}</td>
                      <td className="px-4 py-3 text-sm">{statusBadge(m.status)}</td>
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
