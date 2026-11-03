import { QueryClient } from '@tanstack/react-query'

// Giữ dữ liệu trong 30 giây; chỉ thử lại một lần khi lỗi mạng hoặc lỗi server.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => failureCount < 1 && (error.status === 0 || error.status >= 500),
    },
    mutations: { retry: false },
  },
})
