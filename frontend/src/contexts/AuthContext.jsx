import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

/**
 * AuthContext quản lý trạng thái xác thực của ứng dụng.
 * - user: thông tin user hiện tại (id, email, full_name, role)
 * - token: JWT access token
 * - login(email, password): gọi API đăng nhập, lưu vào localStorage
 * - register(email, password, full_name): gọi API đăng ký
 * - logout(): xóa localStorage và reset state
 * - useAuth(): custom hook để consume context
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục state từ localStorage khi component mount.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email, password) {
    const response = await axiosClient.post('/auth/login', { email, password });
    const { access_token, user: userData } = response.data.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  }

  async function register(email, password, full_name) {
    const response = await axiosClient.post('/auth/register', {
      email,
      password,
      full_name,
    });
    const { access_token, user: userData } = response.data.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  const value = { user, token, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
