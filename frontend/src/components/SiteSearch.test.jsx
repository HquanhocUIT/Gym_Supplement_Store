import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';
import axiosClient from '../api/axiosClient';
import { keywordDestination } from '../lib/siteSearch';
import SiteSearch from './SiteSearch';
import ProtectedRoute from './ProtectedRoute';
import StoreShopPage from '../pages/StoreShopPage';
import LoginPage from '../pages/auth/LoginPage';

const originalAdapter = apiClient.defaults.adapter;
const originalAuthAdapter = axiosClient.defaults.adapter;
let client;
afterEach(() => {
  cleanup(); client?.clear(); localStorage.clear();
  apiClient.defaults.adapter = originalAdapter; axiosClient.defaults.adapter = originalAuthAdapter;
});

function LocationProbe() {
  const location = useLocation(), navigate = useNavigate();
  return <><output data-testid="location">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Go back</button><button onClick={() => navigate(1)}>Go forward</button><button onClick={() => navigate('/shop?q=creatine')}>Find creatine</button></>;
}
function renderSearch({ scope = 'store', path = '/' } = {}) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  apiClient.defaults.adapter = vi.fn(async (config) => ({ config, status: 200, headers: {}, data: {
    success: true, data: config.url === '/store/categories' ? [] : {
      items: [{ id: 1, name: `Result for ${config.params.q || 'all'}`, total_stock: 2, lowest_price: '100000' }],
      pagination: { page: config.params.page, limit: 12, total: 1, totalPages: 1 },
    },
  } }));
  render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={[path]}>
    <SiteSearch scope={scope} /><LocationProbe />
    <Routes><Route path="/" element={<h1>Home</h1>} /><Route path="/shop" element={<StoreShopPage />} />
      <Route path="/pricing" element={<h1>Membership plans</h1>} />
      <Route path="/member/orders" element={<ProtectedRoute><h1>My orders</h1></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} /><Route path="/admin/dashboard" element={<h1>Admin dashboard</h1>} />
    </Routes>
  </MemoryRouter></AuthProvider></QueryClientProvider>);
}

it('mở ô Enter a keyword, xóa nội dung, Escape đóng và trả focus về nút tìm kiếm', () => {
  renderSearch();
  const trigger = screen.getByRole('button', { name: 'Search the site' });
  fireEvent.click(trigger);
  const input = screen.getByPlaceholderText('Enter a keyword');
  expect(document.activeElement).toBe(input);
  expect(screen.getByRole('button', { name: 'Submit search' }).disabled).toBe(true);
  fireEvent.change(input, { target: { value: 'whey' } });
  fireEvent.click(screen.getByRole('button', { name: 'Clear keyword' }));
  expect(input.value).toBe(''); expect(document.activeElement).toBe(input);
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(trigger);
});
it('Enter tìm sản phẩm và Shop đọc đúng keyword trên URL', async () => {
  renderSearch(); fireEvent.click(screen.getByRole('button', { name: 'Search the site' }));
  fireEvent.change(screen.getByRole('searchbox', { name: 'Keyword' }), { target: { value: '  whey  ' } });
  fireEvent.submit(screen.getByRole('search', { name: 'Search the site' }));
  await screen.findByText('Result for whey');
  expect(screen.getByTestId('location').textContent).toBe('/shop?q=whey');
  expect(screen.getByLabelText('Search by product name').value).toBe('whey');
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('gợi ý và Enter điều hướng tới trang kế hoạch tập', async () => {
  renderSearch(); fireEvent.click(screen.getByRole('button', { name: 'Search the site' }));
  fireEvent.change(screen.getByRole('searchbox', { name: 'Keyword' }), { target: { value: 'gym' } });
  expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Membership plans' })).toBeTruthy();
  fireEvent.submit(screen.getByRole('search'));
  await screen.findByRole('heading', { name: 'Membership plans' });
  expect(screen.getByTestId('location').textContent).toBe('/pricing');
});
it('tìm orders khi chưa đăng nhập sẽ trở lại đúng Orders sau login', async () => {
  axiosClient.defaults.adapter = vi.fn(async (config) => ({ config, status: 200, headers: {}, data: { success: true, data: {
    access_token: 'search-login', user: { user_id: 7, full_name: 'Search Member', role: 'member' },
  } } }));
  renderSearch(); fireEvent.click(screen.getByRole('button', { name: 'Search the site' }));
  fireEvent.change(screen.getByRole('searchbox', { name: 'Keyword' }), { target: { value: 'orders' } });
  fireEvent.click(screen.getByRole('button', { name: 'My orders' }));
  await screen.findByRole('heading', { name: 'Login' });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'local test password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Login' }));
  await screen.findByRole('heading', { name: 'My orders' });
  expect(screen.getByTestId('location').textContent).toBe('/member/orders');
});
it('Shop đồng bộ URL khi đổi từ khóa, nút Back và xóa toàn bộ bộ lọc', async () => {
  renderSearch({ path: '/shop?q=whey&category=1&minPrice=10&page=2' });
  await screen.findByText('Result for whey');
  fireEvent.click(screen.getByRole('button', { name: 'Find creatine' }));
  await screen.findByText('Result for creatine');
  expect(screen.getByLabelText('Search by product name').value).toBe('creatine');
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  await screen.findByText('Result for whey');
  expect(screen.getByLabelText('Search by product name').value).toBe('whey');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/shop'));
  await screen.findByText('Result for all');
});
it('từ khóa trang hỗ trợ tiếng Việt, admin riêng và không coi URL ngoài là điểm đến', () => {
  expect(keywordDestination('đơn hàng')).toBe('/member/orders');
  expect(keywordDestination('my plan')).toBe('/member/plan');
  expect(keywordDestination('giỏ hàng')).toBe('/cart');
  expect(keywordDestination('doanh thu', 'admin')).toBe('/admin/dashboard');
  expect(keywordDestination('whey isolate', 'admin')).toBe('/admin/products?q=whey+isolate');
  expect(keywordDestination('https://example.test')).toBe('/shop?q=https%3A%2F%2Fexample.test');
  expect(keywordDestination('   ')).toBeNull();
});

it('Back sau khi nhập tại Shop khôi phục ô trống và toàn bộ kết quả, không rời Shop', async () => {
  renderSearch({ path: '/shop' });
  await screen.findByText('Result for all');
  for (const value of ['w', 'wh', 'whey']) fireEvent.change(screen.getByLabelText('Search by product name'), { target: { value } });
  await screen.findByText('Result for whey');
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(screen.getByTestId('location').textContent).toBe('/shop');
  expect(screen.getByLabelText('Search by product name').value).toBe('');
  await screen.findByText('Result for all');
  fireEvent.click(screen.getByRole('button', { name: 'Go forward' }));
  await screen.findByText('Result for whey');
  expect(screen.getByLabelText('Search by product name').value).toBe('whey');
});
