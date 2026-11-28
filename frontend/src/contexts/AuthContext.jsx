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
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

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

  useEffect(() => {
    let active = true;
    let refreshing = false;

    const refreshSession = async () => {
      if (!active || refreshing) return;
      const existingToken = getAccessToken();
      if (!existingToken) {
        setSession(readSession());
        setIsLoading(false);
        return;
      }

      refreshing = true;
      try {
        const response = await axiosClient.post('/auth/refresh');
        if (!active || getAccessToken() !== existingToken) return;

        const refreshed = response.data?.data;
        if (!refreshed?.access_token || !refreshed?.user) return;
        saveAccessToken(refreshed.access_token, refreshed.user);
        setSession({ token: refreshed.access_token, user: refreshed.user });
      } catch (error) {
        if (error.response?.status === 401 && getAccessToken() === existingToken) {
          clearAccessToken();
          if (active) setSession({ token: null, user: null });
        }
      } finally {
        refreshing = false;
        if (active) setIsLoading(false);
      }
    };

    refreshSession();
    window.addEventListener('focus', refreshSession);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshSession);
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

  async function loginWithGoogle(credential) {
    const response = await axiosClient.post('/auth/google', { credential });
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

  return <AuthContext.Provider value={{ ...session, isLoading, login, loginWithGoogle, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
