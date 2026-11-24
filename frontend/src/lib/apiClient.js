import axios from 'axios';
import { getAccessToken } from './authToken.js';
import { englishApiMessage } from './apiError.js';

// Dùng chung địa chỉ API và thời gian chờ cho các request từ frontend.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '') || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { Accept: 'application/json' },
});

// Đính kèm token đăng nhập cho các API cần xác thực.
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }

  return config;
});

// Chuyển lỗi mạng và lỗi HTTP thành thông báo dễ hiển thị.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    let message = error.response?.data?.error?.message;
    if (!message) {
      if (error.response) {
        message = 'Something went wrong. Please try again.';
      } else if (error.code === 'ECONNABORTED') {
        message = 'The server is taking too long. Please try again.';
      } else {
        message = 'Unable to connect. Please check your connection and try again.';
      }
    }

    const apiError = new Error(englishApiMessage(message, error.response?.data?.error?.code, error.response?.status));
    apiError.status = error.response?.status || 0;
    apiError.code = error.response?.data?.error?.code || error.code || 'API_ERROR';
    return Promise.reject(apiError);
  },
);

// Lấy phần data theo quy ước phản hồi { success, data, error } của backend.
function getResponseData(response) {
  const body = response.data;

  if (body?.success !== true || !Object.hasOwn(body, 'data')) {
    const error = new Error(body?.error?.message ? englishApiMessage(body.error.message, body.error.code, response.status) : 'The server returned an unexpected response.');
    error.status = response.status;
    error.code = body?.error?.code || 'INVALID_RESPONSE';
    throw error;
  }

  return body.data;
}

// Gửi các loại request có body như POST, PUT hoặc DELETE.
export async function requestApiData(method, url, data, config = {}) {
  const response = await apiClient.request({ method, url, data, ...config });
  return getResponseData(response);
}

// GET dùng chung cho các trang cần đọc dữ liệu.
export async function getApiData(url, config = {}) {
  return requestApiData('get', url, undefined, config);
}
