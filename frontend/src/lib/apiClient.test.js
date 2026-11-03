import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, CanceledError } from 'axios'
import { apiClient, getApiData } from './apiClient.js'

const originalAdapter = apiClient.defaults.adapter

// Giả lập phản hồi HTTP để kiểm tra API client mà không gọi server thật.
function response(data, status = 200) {
  return { data, status, statusText: 'OK', headers: {}, config: {} }
}

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
})

describe('API client', () => {
  it('lấy đúng phần data trong phản hồi thành công', async () => {
    apiClient.defaults.adapter = vi.fn().mockResolvedValue(response({ success: true, data: { status: 'ok' }, error: null }))
    await expect(getApiData('/health')).resolves.toEqual({ status: 'ok' })
  })

  it('không nhận nhầm HTML hoặc phản hồi thiếu data là thành công', async () => {
    apiClient.defaults.adapter = vi.fn().mockResolvedValue(response('<html>Không phải API</html>'))
    await expect(getApiData('/health')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('vẫn báo lỗi nếu HTTP 200 nhưng success là false', async () => {
    apiClient.defaults.adapter = vi.fn().mockResolvedValue(response({ success: false, data: null, error: { code: 'INVALID_INPUT', message: 'Dữ liệu không hợp lệ' } }))
    await expect(getApiData('/health')).rejects.toMatchObject({ code: 'INVALID_INPUT', message: 'Dữ liệu không hợp lệ' })
  })

  it('giữ thông báo và mã lỗi HTTP của backend', async () => {
    const errorResponse = response({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' } }, 404)
    apiClient.defaults.adapter = vi.fn().mockRejectedValue(new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, errorResponse))
    await expect(getApiData('/missing')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu' })
  })

  it('đưa ra thông báo dễ hiểu khi backend chưa chạy', async () => {
    apiClient.defaults.adapter = vi.fn().mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'))
    await expect(getApiData('/health')).rejects.toMatchObject({ status: 0, message: 'Không kết nối được API. Kiểm tra backend rồi thử lại.' })
  })

  it('giữ nguyên lỗi hủy request cho TanStack Query', async () => {
    const canceled = new CanceledError()
    apiClient.defaults.adapter = vi.fn().mockRejectedValue(canceled)
    await expect(getApiData('/health')).rejects.toBe(canceled)
  })
})
