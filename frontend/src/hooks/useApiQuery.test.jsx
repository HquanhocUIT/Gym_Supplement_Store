import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient.js'
import useApiQuery from './useApiQuery.js'

const originalAdapter = apiClient.defaults.adapter

afterEach(() => {
  cleanup()
  apiClient.defaults.adapter = originalAdapter
})

it('đổi bộ lọc sẽ lấy dữ liệu mới và không dùng nhầm cache trang trước', async () => {
  // Mỗi trang trả dữ liệu khác nhau để phát hiện lỗi dùng chung query key.
  apiClient.defaults.adapter = vi.fn(async (config) => ({
    data: { success: true, data: { page: config.params.page }, error: null },
    status: 200, statusText: 'OK', headers: {}, config,
  }))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>

  const { result, rerender } = renderHook(
    ({ page }) => useApiQuery({ queryKey: ['products'], url: '/products', params: { page } }),
    { wrapper, initialProps: { page: 1 } },
  )

  await waitFor(() => expect(result.current.data).toEqual({ page: 1 }))
  rerender({ page: 2 })
  await waitFor(() => expect(result.current.data).toEqual({ page: 2 }))
  expect(apiClient.defaults.adapter.mock.calls.every(([config]) => config.signal instanceof AbortSignal)).toBe(true)
  client.clear()
})
