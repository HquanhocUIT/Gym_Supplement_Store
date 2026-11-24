import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';

// URL là nguồn bộ lọc để tìm từ header, tải lại trang và nút Back luôn đồng bộ.
export default function useCatalogSearchParams() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigationType = useNavigationType();
  const editing = useRef(null);
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  // Back/Forward kết thúc lần nhập trước; thao tác mới phải tạo lịch sử mới.
  useEffect(() => {
    if (navigationType === 'POP') editing.current = null;
  }, [location.key, navigationType]);

  function finishEditing() { editing.current = null; }

  function updateFilters(changes, { typing = false } = {}) {
    const next = new URLSearchParams(params);
    next.delete('page');
    for (const [key, value] of Object.entries(changes)) {
      if (value === '' || value == null) next.delete(key);
      else next.set(key, String(value));
    }
    if (next.toString() === params.toString()) return;
    const field = Object.keys(changes).join(',');
    // Chữ đầu tiên push để giữ trạng thái trước khi nhập; các chữ sau replace
    // cùng lượt nhập. Back chỉ cần một lần, không phải đi qua w → wh → whe.
    const replace = typing && editing.current?.field === field
      && editing.current.pathname === location.pathname
      && editing.current.search === params.toString();
    editing.current = typing ? { field, pathname: location.pathname, search: next.toString() } : null;
    setParams(next, { replace });
  }
  function setPage(nextPage) {
    finishEditing();
    if (nextPage === page) return;
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (nextPage === 1) next.delete('page');
      else next.set('page', String(nextPage));
      return next;
    });
  }
  return {
    search: params.get('q') || '', category: params.get('category') || '',
    minPrice: params.get('minPrice') || '', maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || 'newest', page, updateFilters, setPage,
    finishEditing, isHistoryNavigation: navigationType === 'POP',
    clearFilters: () => { finishEditing(); if (params.toString()) setParams({}); },
  };
}
