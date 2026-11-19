// Lấy token đã lưu; kiểm tra window để module cũng chạy được khi render bằng test.
export function getAccessToken() {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem('access_token') || ''
  } catch {
    return ''
  }
}

// Lưu token sau khi đăng nhập và báo cho header cập nhật trạng thái.
export function saveAccessToken(token) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem('access_token', token)
  window.dispatchEvent(new Event('auth-token-changed'))
}

// Xóa token khi người dùng đăng xuất.
export function clearAccessToken() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem('access_token')
  window.dispatchEvent(new Event('auth-token-changed'))
}
