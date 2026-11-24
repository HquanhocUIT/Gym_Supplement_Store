import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import StoreShopPage from '../pages/StoreShopPage';
import StoreProductDetailPage from '../pages/StoreProductDetailPage';

const originalAdapter = apiClient.defaults.adapter;
let client;
afterEach(() => { cleanup(); client.clear(); apiClient.defaults.adapter = originalAdapter; });
function Probe() {
  const location = useLocation(), navigate = useNavigate();
  return <><output data-testid="url">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Browser Back</button></>;
}
function setup(path = '/shop?q=whey&category=1&page=2') {
  const product = { id: 1, name: 'Daily Whey', category_id: 1, category_name: 'Whey', total_stock: 3, lowest_price: '100000', variants: [{ id: 1, size: '1 kg', price: '100000', stock: 3 }] };
  apiClient.defaults.adapter = async (config) => ({ config, status: 200, headers: {}, data: { success: true, data: config.url === '/store/categories' ? [{ id: 1, name: 'Whey' }] : config.url === '/store/products/1' ? product : { items: [product], pagination: { page: config.params.page, limit: 12, total: 20 } } } });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/', path]}><Probe /><Routes>
    <Route path="/" element={<h1>Home</h1>} /><Route path="/shop" element={<StoreShopPage />} /><Route path="/product/:productId" element={<StoreProductDetailPage />} />
  </Routes></MemoryRouter></QueryClientProvider>);
}
it('Back to shop trả về đúng từ khóa, category, page và không tạo vòng lặp lịch sử', async () => {
  setup();
  fireEvent.click(await screen.findByRole('link', { name: 'View Daily Whey' }));
  await screen.findByRole('heading', { name: 'Daily Whey', exact: true });
  const back = screen.getByRole('link', { name: 'Back to shop' });
  expect(back.getAttribute('href')).toBe('/shop?q=whey&category=1&page=2');
  fireEvent.click(back);
  await screen.findByRole('heading', { name: 'Shop supplements' });
  expect(screen.getByTestId('url').textContent).toBe('/shop?q=whey&category=1&page=2');
  expect(screen.getByLabelText('Search by product name').value).toBe('whey');
  fireEvent.click(screen.getByRole('button', { name: 'Browser Back' }));
  await screen.findByRole('heading', { name: 'Home' });
});
it('mở trực tiếp chi tiết vẫn có Back to shop an toàn', async () => {
  setup('/product/1');
  await screen.findByRole('heading', { name: 'Daily Whey', exact: true });
  fireEvent.click(screen.getByRole('link', { name: 'Back to shop' }));
  await screen.findByRole('heading', { name: 'Shop supplements' });
  expect(screen.getByTestId('url').textContent).toBe('/shop');
});
