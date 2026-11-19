import axios from 'axios';

/**
 * Axios instance used throughout the frontend.
 * Base URL points to the backend API. Each request automatically
 * attaches the Bearer token from localStorage if present.
 */
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

/**
 * Request interceptor: attach Authorization: Bearer <token>
 * if a token exists in localStorage.
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
