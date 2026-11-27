import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import axiosClient from '../../api/axiosClient';
import { clearAccessToken, getAccessToken, saveAccessToken } from '../../lib/authToken';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const originalAdapter = axiosClient.defaults.adapter;
afterEach(() => {
  cleanup();
  localStorage.clear();
  axiosClient.defaults.adapter = originalAdapter;
  delete window.google;
  vi.unstubAllEnvs();
});

function renderLogin() {
  return render(
    <AuthProvider><MemoryRouter initialEntries={['/login']}><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<h1>Admin dashboard</h1>} />
      <Route path="/member/dashboard" element={<h1>Member dashboard</h1>} />
    </Routes></MemoryRouter></AuthProvider>,
  );
}

it('signs a member in with the Google ID credential and saves the same app session', async () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-web-client-id');
  let googleCallback;
  let request;
  window.google = { accounts: { id: {
    initialize: vi.fn(({ callback }) => { googleCallback = callback; }),
    renderButton: vi.fn((element) => { element.textContent = 'Continue with Google'; }),
  } } };
  axiosClient.defaults.adapter = vi.fn(async (config) => {
    request = { url: config.url, body: JSON.parse(config.data) };
    return { config, status: 200, headers: {}, data: { success: true, data: {
      access_token: 'google-session',
      user: { user_id: 12, email: 'member@example.test', full_name: 'Gym Member', role: 'member' },
    } } };
  });

  renderLogin();
  await waitFor(() => expect(window.google.accounts.id.renderButton).toHaveBeenCalled());
  await act(async () => { await googleCallback({ credential: 'g'.repeat(120) }); });
  await screen.findByRole('heading', { name: 'Member dashboard' });

  expect(request.url).toBe('/auth/google');
  expect(request.body.credential).toHaveLength(120);
  expect(getAccessToken()).toBe('google-session');
});

it('hiện và ẩn mật khẩu mà không đổi giá trị hoặc gửi form', () => {
  const adapter = vi.fn();
  axiosClient.defaults.adapter = adapter;
  renderLogin();
  const field = screen.getByLabelText('Password');
  fireEvent.change(field, { target: { value: 'Example password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(field.type).toBe('text');
  expect(field.value).toBe('Example password');
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(field.type).toBe('password');
  expect(adapter).not.toHaveBeenCalled();
});

it('đăng nhập admin, lưu cùng phiên cho Store và chuyển đúng trang', async () => {
  let request;
  axiosClient.defaults.adapter = vi.fn(async (config) => {
    request = JSON.parse(config.data);
    return { config, status: 200, headers: {}, data: { success: true, data: {
      access_token: 'qa-session',
      user: { user_id: 1, email: 'owner@example.test', role: 'admin' },
    } } };
  });
  renderLogin();
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' owner@example.test ' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Example password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));
  await screen.findByRole('heading', { name: 'Admin dashboard' });
  expect(request.email).toBe('owner@example.test');
  expect(getAccessToken()).toBe('qa-session');
  expect(localStorage.getItem('token')).toBe('qa-session');
  expect(JSON.parse(localStorage.getItem('user')).role).toBe('admin');
});

it('báo sai thông tin đăng nhập và cho phép thử lại', async () => {
  axiosClient.defaults.adapter = vi.fn(async (config) => {
    throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
      status: 401, data: { error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' } },
    });
  });
  renderLogin();
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login', exact: true }));
  expect((await screen.findByRole('alert')).textContent).toBe('Email or password is incorrect.');
  expect(screen.getByLabelText('Password').value).toBe('wrong-password');
  expect(getAccessToken()).toBe('');
});

// Thao tác từ giỏ hàng phải cập nhật cả quyền truy cập Gym trong cùng tab.
function SessionProbe() {
  const { user } = useAuth();
  return <output>{user?.role || 'guest'}</output>;
}
it('đồng bộ user khi Store lưu phiên và xóa phiên khi đăng xuất', async () => {
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  saveAccessToken('cart-session', { role: 'member' });
  await screen.findByText('member');
  clearAccessToken();
  await screen.findByText('guest');
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
});

it('khôi phục phiên đã có sau khi tải lại trang', () => {
  saveAccessToken('existing-session', { role: 'admin' });
  render(<AuthProvider><SessionProbe /></AuthProvider>);
  expect(screen.getByText('admin')).toBeTruthy();
});

it('form đăng ký cũng có nút xem mật khẩu và nhãn cho từng ô', () => {
  render(<AuthProvider><MemoryRouter><RegisterPage /></MemoryRouter></AuthProvider>);
  expect(screen.getByLabelText('Full name')).toBeTruthy();
  const field = screen.getByLabelText('Password');
  expect(field.autocomplete).toBe('new-password');
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(field.type).toBe('text');
});
