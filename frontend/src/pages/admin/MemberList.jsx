import { Search, Shield, Users } from 'lucide-react';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import useApiQuery from '../../hooks/useApiQuery';
import useCatalogSearchParams from '../../hooks/useCatalogSearchParams';
import { useAuth } from '../../contexts/AuthContext';

/**
 * MemberList - Admin page to manage members.
 * Calls GET /members to list members.
 * Includes search by name or email.
 * Search và phân trang lưu trong URL để Back/Forward khôi phục được danh sách.
 */
export default function MemberList() {
  const { user } = useAuth();
  const { search, page, updateFilters, setPage, finishEditing } = useCatalogSearchParams();
  // API trả { members, pagination }, không phải mảng; không thay lỗi bằng dữ liệu giả.
  const query = useApiQuery({
    queryKey: ['admin-members', user?.user_id ?? user?.id ?? user?.email],
    url: '/members', params: { search: search.trim() || undefined, page, limit: 10 }, retry: false,
  });
  const filteredMembers = query.data?.members || [];
  const pagination = query.data?.pagination;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  const statusBadge = (status) => {
    const variants = {
      active: 'bg-[#9aca42]/10 text-[#9aca42]',
      expired: 'bg-[#ef4444]/10 text-[#ef4444]',
      cancelled: 'bg-[#6a8a66]/10 text-[#6a8a66]',
      pending: 'bg-[#d97706]/10 text-[#d97706]',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[status] || 'bg-[#6a8a66]/10 text-[#6a8a66]'}`}>
        <Shield size={12} />
        {status || 'No membership'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6f3]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Members</h1>
            <p className="text-sm text-muted">Manage gym members and their membership plans.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-10"
              placeholder="Search by name or email..."
              aria-label="Search members"
              value={search}
              onChange={(e) => updateFilters({ q: e.target.value }, { typing: true })}
              onBlur={finishEditing}
              onKeyDown={(e) => { if (e.key === 'Enter') finishEditing(); }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#e3e9e1] bg-white shadow-card">
          {query.isPending ? (
            <div className="space-y-3 p-5" aria-label="Loading members">
              {[0, 1, 2, 3, 4].map((item) => (
                <Skeleton className="h-12 w-full" key={item} />
              ))}
            </div>
          ) : query.isError ? (
            <div className="p-5" role="alert"><p className="text-sm text-red-700">{query.error.message}</p><button className="mt-3 min-h-11 rounded-xl border border-line px-4 text-sm font-bold" type="button" onClick={() => query.refetch()}>Try again</button></div>
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              description={search ? 'No members match your search.' : 'Members will appear here when available.'}
              icon={Users}
              title="No data yet"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
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
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-[#f4f6f3]/50">
                      <td className="px-4 py-3 text-sm font-medium text-ink">{m.full_name}</td>
                      <td className="px-4 py-3 text-sm text-muted">{m.email}</td>
                      <td className="px-4 py-3 text-sm text-ink">{m.plan_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDate(m.start_date)}</td>
                      <td className="px-4 py-3 text-sm text-muted">{formatDate(m.end_date)}</td>
                      <td className="px-4 py-3 text-sm">{statusBadge(m.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination && !query.isError && <div className="border-t border-line p-4"><Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={setPage} disabled={query.isFetching} /></div>}
        </div>
      </div>
    </div>
  );
}
