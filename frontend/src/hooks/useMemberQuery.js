import { useAuth } from '../contexts/AuthContext';
import useApiQuery from './useApiQuery';

// Tách cache theo tài khoản để lịch sử của người trước không hiện ở phiên sau.
export default function useMemberQuery(url, params) {
  const { user } = useAuth();
  return useApiQuery({
    queryKey: ['member-account', user?.user_id ?? user?.id ?? user?.email, url],
    url, params, enabled: Boolean(user), retry: false,
  });
}
