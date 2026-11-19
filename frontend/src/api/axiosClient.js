import axios from 'axios';

/**
 * Axios instance dùng chung cho toàn bộ frontend.
 * Base URL trỏ về backend API. Mỗi request sẽ tự động gắn Bearer token
 * từ localStorage nếu có.
 */
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

/**
 * Request interceptor: gắn Authorization: Bearer <token> nếu có token trong localStorage.
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
