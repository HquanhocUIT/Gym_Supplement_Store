import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthProvider } from '../../contexts/AuthContext';
import MemberLayout from '../../layouts/MemberLayout';
import ProtectedRoute from '../../components/ProtectedRoute';
import MemberDashboardPage from '../MemberDashboardPage';
import MembershipPage from './MembershipPage';
import OrdersPage from './OrdersPage';
import OrderDetailPage from './OrderDetailPage';
import { apiClient } from '../../lib/apiClient';
import { membershipStatus } from './accountUi';

const originalAdapter = apiClient.defaults.adapter;
let client, failMemberships, empty;
beforeEach(() => {
  failMemberships = false; empty = false;
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  localStorage.setItem('access_token', 'account-test-session');
  localStorage.setItem('user', JSON.stringify({ user_id: 7, full_name: 'Quân Test', role: 'member' }));
  apiClient.defaults.adapter = vi.fn(async (config) => {
    let data;
    if (config.url === '/me/profile') data = { id: 7, full_name: 'Quân Test', role: 'member' };
    else if (config.url === '/me/memberships') {
      if (failMemberships) throw new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { error: { message: 'Memberships unavailable' } } });
      data = empty ? [] : [{ id: 1, plan_name: 'Annual membership', start_date: '2020-01-01', end_date: '2099-01-01', status: 'active', price: '1000000' }];
    } else if (config.url === '/me/checkins') data = empty ? [] : [{ id: 1, checkin_time: '2026-11-24T03:00:00Z' }];
    else if (config.url === '/store/orders') {
      const page = config.params.page;
      data = { items: empty ? [] : [{ id: page === 2 ? 2 : 1, total_amount: '180000', item_count: 2, status: 'pending', created_at: '2026-11-24T03:00:00Z' }], pagination: { page, limit: config.params.limit, total: empty ? 0 : 13 } };
    } else if (config.url === '/store/orders/404') throw new AxiosError('Not found', 'ERR_BAD_REQUEST', config, null, { status: 404, data: { error: { code: 'ORDER_NOT_FOUND', message: 'Order not found.' } } });
    else data = { id: 2, recipient_name: 'Quân Test', recipient_phone: '0900000000', shipping_address: 'Delivery address', total_amount: '180000', subtotal: '200000', discount_amount: '20000', status: 'pending', created_at: '2026-11-24T03:00:00Z', items: [{ id: 1, product_name: 'Daily Whey', variant_description: 'Vanilla · 1 kg', quantity: 2, price: '100000' }], payment: { payment_method: 'cod', status: 'pending' } };
    return { config, status: 200, headers: {}, data: { success: true, data } };
  });
});
afterEach(() => { cleanup(); client.clear(); localStorage.clear(); apiClient.defaults.adapter = originalAdapter; vi.restoreAllMocks(); });

function renderAccount(path = '/member') {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/member" element={<ProtectedRoute><MemberLayout /></ProtectedRoute>}>
      <Route index element={<MemberDashboardPage />} /><Route path="plan" element={<MembershipPage />} />
      <Route path="orders" element={<OrdersPage />} /><Route path="orders/:orderId" element={<OrderDetailPage />} />
    </Route><Route path="/login" element={<h1>Sign in page</h1>} /><Route path="/shop" element={<h1>Shop</h1>} />
  </Routes></MemoryRouter></AuthProvider></QueryClientProvider>);
}

it('dùng tên thật và chuyển My plan, Orders tới nội dung và đường dẫn riêng', async () => {
  renderAccount();
  await screen.findByRole('heading', { name: 'Welcome, Quân Test.' });
  expect(screen.queryByText(/Alex|FF-2078|Upper body/)).toBeNull();
  const nav = within(screen.getByRole('navigation', { name: 'Member navigation' }));
  fireEvent.click(nav.getByRole('link', { name: 'My plan' }));
  await screen.findByRole('heading', { name: 'Annual membership' });
  expect(nav.getByRole('link', { name: 'My plan' }).getAttribute('aria-current')).toBe('page');
  fireEvent.click(nav.getByRole('link', { name: 'Orders' }));
  await screen.findByRole('heading', { name: 'Order #1' });
  expect(nav.getByRole('link', { name: 'Orders' }).getAttribute('aria-current')).toBe('page');
  expect(nav.getByRole('link', { name: 'My plan' }).getAttribute('aria-current')).toBeNull();
});
it('phân trang và mở chi tiết đơn với địa chỉ, snapshot và payment thật', async () => {
  renderAccount('/member/orders');
  await screen.findByRole('heading', { name: 'Order #1' });
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByRole('heading', { name: 'Order #2' });
  fireEvent.click(screen.getByRole('link', { name: 'View order #2' }));
  await screen.findByText('Delivery address', { selector: 'p' });
  expect(screen.getByText('Daily Whey')).toBeTruthy();
  expect(screen.getByText(/Cash on delivery/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Back to my orders' }).getAttribute('href')).toBe('/member/orders?page=2');
  fireEvent.click(screen.getByRole('link', { name: 'Back to my orders' }));
  await screen.findByRole('heading', { name: 'Order #2' });
  expect(screen.getByText('13–13 / 13 results')).toBeTruthy();
});
it('mở trực tiếp trang kế hoạch với trạng thái trống và hành động rõ ràng', async () => {
  empty = true; renderAccount('/member/plan');
  await screen.findByText('No membership yet');
  expect(screen.getByRole('link', { name: 'Browse membership plans' }).getAttribute('href')).toBe('/pricing');
  expect(await screen.findByText('No visits recorded')).toBeTruthy();
});
it('phân biệt lỗi tải gói với gói trống và cho phép thử lại', async () => {
  failMemberships = true; renderAccount('/member/plan');
  await screen.findByText('Memberships unavailable');
  expect(screen.queryByText('No membership yet')).toBeNull();
  failMemberships = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('heading', { name: 'Annual membership' });
});
it('đơn không thuộc người dùng hiển thị lỗi 404 và vẫn có đường quay lại', async () => {
  renderAccount('/member/orders/404');
  await screen.findByText('Order not found.');
  expect(screen.queryByText('Delivery address')).toBeNull();
  expect(screen.getByRole('link', { name: 'Back to my orders' })).toBeTruthy();
});
it('đăng xuất xóa token và cache riêng tư', async () => {
  renderAccount('/member/orders');
  await screen.findByRole('heading', { name: 'Order #1' });
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await screen.findByRole('heading', { name: 'Sign in page' });
  expect(localStorage.getItem('access_token')).toBeNull();
  await waitFor(() => expect(client.getQueryCache().getAll().length).toBe(0));
});
it('gói tương lai và gói hết hạn không được ghi là đang hoạt động', () => {
  // Trường hợp này không render nên tạo client để cleanup chung vẫn chạy.
  client = new QueryClient();
  const membership = { status: 'active', start_date: '2026-11-01', end_date: '2026-11-24' };
  expect(membershipStatus(membership, new Date('2026-11-24T16:00:00Z'))).toBe('active');
  expect(membershipStatus(membership, new Date('2026-11-24T18:00:00Z'))).toBe('expired');
  expect(membershipStatus(membership, new Date('2026-10-01T00:00:00Z'))).toBe('upcoming');
});
