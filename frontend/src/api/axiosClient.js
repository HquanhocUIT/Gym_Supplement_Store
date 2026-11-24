import axios from 'axios';
import { getAccessToken } from '../lib/authToken';
import { englishApiMessage } from '../lib/apiError';

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
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;

// Giữ cấu trúc Axios để các trang Gym hiện tại vẫn đọc được lỗi từ response.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error;
    const message = error.code === 'ECONNABORTED'
      ? 'The server is taking too long. Please try again.'
      : error.response
        ? englishApiMessage(apiError?.message, apiError?.code, error.response.status)
        : 'Unable to connect. Please check your connection and try again.';
    error.message = message;
    if (apiError) apiError.message = message;
    return Promise.reject(error);
  },
);
