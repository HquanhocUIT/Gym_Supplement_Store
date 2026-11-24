import { Link } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import Skeleton from '../../components/common/Skeleton';
import { accountButton, accountCard } from './accountUi';

// Không biến lỗi mạng thành trạng thái chưa có dữ liệu; luôn có hành động thử lại.
export default function AccountQueryState({ query, children }) {
  if (query.isPending) return <div role="status" aria-label="Loading account data" className="space-y-3"><Skeleton className="h-32 w-full rounded-card" /><Skeleton className="h-32 w-full rounded-card" /></div>;
  if (query.isError) return <section className={accountCard} role="alert">
    <CircleAlert className="text-red-700" aria-hidden="true" />
    <h2 className="mt-3 text-lg font-bold">Unable to load this section</h2>
    <p className="mt-2 text-sm text-ink-soft">{query.error.message}</p>
    {query.error.status === 401
      ? <Link className={`${accountButton} mt-4`} to="/login">Sign in again</Link>
      : <button className={`${accountButton} mt-4`} onClick={() => query.refetch()} type="button">Try again</button>}
  </section>;
  return children;
}
