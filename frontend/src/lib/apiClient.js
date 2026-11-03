import axios from 'axios'

// Dùng một Axios instance để các trang dùng chung địa chỉ API và thời gian chờ.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { Accept: 'application/json' },
})

// Đổi lỗi mạng và lỗi HTTP thành thông báo dễ hiển thị trong giao diện.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Giữ nguyên lỗi hủy để TanStack Query nhận biết request đã bị dừng.
    if (axios.isCancel(error)) return Promise.reject(error)

    let message = error.response?.data?.error?.message

    if (!message) {
      if (error.response) {
        message = 'API gặp lỗi. Vui lòng thử lại.'
      } else if (error.code === 'ECONNABORTED') {
        message = 'API phản hồi quá lâu. Vui lòng thử lại.'
      } else {
        message = 'Không kết nối được API. Kiểm tra backend rồi thử lại.'
      }
    }

    const apiError = new Error(message)
    apiError.status = error.response?.status || 0
    apiError.code = error.response?.data?.error?.code || error.code || 'API_ERROR'
    return Promise.reject(apiError)
  },
)

// Lấy phần data theo quy ước { success, data, error } của backend.
export async function getApiData(url, config = {}) {
  const response = await apiClient.get(url, config)
  const body = response.data

  if (body?.success !== true || !Object.hasOwn(body, 'data')) {
    const error = new Error(body?.error?.message || 'Phản hồi API không đúng định dạng.')
    error.status = response.status
    error.code = body?.error?.code || 'INVALID_RESPONSE'
    throw error
  }

  return body.data
}
