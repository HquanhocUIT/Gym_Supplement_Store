import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../lib/authToken';

const AuthContext = createContext(null);

// Đọc cùng một phiên cho Gym, Store và Admin, kể cả sau khi tải lại trang.
function readSession() {
  try {
    return { token: getAccessToken() || null, user: JSON.parse(localStorage.getItem('user') || 'null') };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  // Đồng bộ khi giỏ hàng đăng nhập, đăng xuất hoặc tab khác thay đổi phiên.
  useEffect(() => {
    const refresh = () => setSession(readSession());
    window.addEventListener('auth-token-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('auth-token-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Lưu token và user cùng nhau để quyền truy cập được cập nhật ngay.
  function saveSession(data) {
    saveAccessToken(data.access_token, data.user);
    setSession({ token: data.access_token, user: data.user });
    return data.user;
  }

  async function login(email, password) {
    const response = await axiosClient.post('/auth/login', { email: email.trim(), password });
    return saveSession(response.data.data);
  }

  async function register(email, password, full_name) {
    const response = await axiosClient.post('/auth/register', {
      email: email.trim(), password, full_name: full_name.trim(),
    });
    return saveSession(response.data.data);
  }

  function logout() {
    clearAccessToken();
    setSession({ token: null, user: null });
  }

  return <AuthContext.Provider value={{ ...session, isLoading: false, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
