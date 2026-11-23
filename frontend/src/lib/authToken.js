// Lấy token đã lưu; kiểm tra window để module cũng chạy được khi render bằng test.
export function getAccessToken() {
  if (typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem('access_token') || window.localStorage.getItem('token') || ''
  } catch {
    return ''
  }
}

// Lưu token sau khi đăng nhập và báo cho header cập nhật trạng thái.
export function saveAccessToken(token, user) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem('access_token', token)
  window.localStorage.setItem('token', token)
  if (user) window.localStorage.setItem('user', JSON.stringify(user))
  window.dispatchEvent(new Event('auth-token-changed'))
}

// Xóa token khi người dùng đăng xuất.
export function clearAccessToken() {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem('access_token')
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth-token-changed'))
}
