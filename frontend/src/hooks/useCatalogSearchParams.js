import { useSearchParams } from 'react-router-dom';

// URL là nguồn bộ lọc để tìm từ header, tải lại trang và nút Back luôn đồng bộ.
export default function useCatalogSearchParams() {
  const [params, setParams] = useSearchParams();
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  function updateFilters(changes) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('page');
      for (const [key, value] of Object.entries(changes)) {
        if (value === '' || value == null) next.delete(key);
        else next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }
  function setPage(nextPage) {
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
    clearFilters: () => setParams({}, { replace: true }),
  };
}
