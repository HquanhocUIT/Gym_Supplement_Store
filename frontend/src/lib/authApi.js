import { requestApiData } from './apiClient.js'

// Đăng nhập và nhận thông tin tài khoản cùng access token.
export function login(email, password) {
  return requestApiData('post', '/auth/login', { email, password })
}
