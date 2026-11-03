import { useQuery } from '@tanstack/react-query'
import { getApiData } from '../lib/apiClient.js'

// Hook GET dùng chung; URL và bộ lọc nằm trong key để cache không bị dùng nhầm.
export default function useApiQuery({ queryKey, url, params, ...options }) {
  return useQuery({
    ...options,
    queryKey: [...queryKey, { url, params }],
    // Truyền signal để request được hủy khi trang không còn cần dữ liệu.
    queryFn: ({ signal }) => getApiData(url, { params, signal }),
  })
}
