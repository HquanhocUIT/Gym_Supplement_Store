import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import { apiClient } from '../lib/apiClient';
import AdminProductsPage from './AdminProductsPage';

const originalAdapter = apiClient.defaults.adapter;
let queryClient;
let products;
let stock;
let requests;

beforeEach(() => {
  stock = 5;
  requests = [];
  products = Array.from({ length: 23 }, (_, index) => ({
    id: index + 1, name: `Product ${index + 1}`, description: 'Sample supplement',
    category_id: index < 12 ? 1 : 2, category_name: index < 12 ? 'Whey' : 'Creatine',
  }));
  // Giả lập đúng hợp đồng API catalog đã phân trang, không giả lập hook.
  apiClient.defaults.adapter = vi.fn(async (config) => {
    requests.push(config);
    let data;
    if (config.url === '/store/categories') data = [{ id: 1, name: 'Whey' }, { id: 2, name: 'Creatine' }];
    else if (config.url === '/store/products' && config.method === 'post') {
      const body = JSON.parse(config.data);
      data = { id: 24, name: body.name, category_id: body.categoryId, category_name: 'Whey' };
      products.unshift(data);
    } else if (config.url === '/store/products') {
      const { page = 1, limit = 12, q = '', category } = config.params;
      const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())
        && (!category || p.category_id === Number(category)));
      data = {
        items: filtered.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
      };
    } else if (config.method === 'put') {
      stock = JSON.parse(config.data).stock;
      data = { id: 101, size: '1 kg', price: 100000, stock };
    } else if (config.method === 'post') data = { id: 101, ...JSON.parse(config.data) };
    else data = [{ id: 101, flavor: 'Vanilla', size: '1 kg', price: '100000', stock }];
    return { config, status: 200, headers: {}, data: { success: true, data, error: null } };
  });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  apiClient.defaults.adapter = originalAdapter;
});

function renderPage() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><MemoryRouter><AdminProductsPage /></MemoryRouter></QueryClientProvider>);
}

it('hiển thị phản hồi { items, pagination } và mở được sản phẩm ngoài trang đầu', async () => {
  renderPage();
  await screen.findByText('Product 1');
  expect(screen.getByText('1–12 / 23 results')).toBeTruthy();
  expect(screen.queryByText('Product 13')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('Product 23');
  expect(screen.getByText('13–23 / 23 results')).toBeTruthy();
  expect(screen.queryByText('Product 1')).toBeNull();
});

it('tìm kiếm và lọc toàn bộ catalog, đồng thời quay về trang đầu', async () => {
  renderPage();
  await screen.findByText('Product 1');
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('Product 23');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Product 23' } });
  await screen.findByText('1–1 / 1 results');
  expect(requests.some((r) => r.params?.page === 1 && r.params?.q === 'Product 23')).toBe(true);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '2' } });
  await screen.findByText('1–11 / 11 results');
  expect(screen.getByText('Product 23')).toBeTruthy();
  expect(screen.queryByText('Product 1')).toBeNull();
});

it('lưu tồn kho và tạo sản phẩm nhiều variant sau khi sửa hợp đồng danh sách', async () => {
  renderPage();
  await screen.findByText('Product 1');
  fireEvent.click(screen.getByRole('button', { name: 'Open Product 1 variants' }));
  fireEvent.change(await screen.findByLabelText('Stock'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save stock' }));
  await waitFor(() => expect(stock).toBe(3));
  await waitFor(() => expect(screen.getByLabelText('Stock').value).toBe('3'));

  fireEvent.click(screen.getByRole('button', { name: 'Add product' }));
  fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'New demo product' } });
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } });
  fireEvent.change(screen.getByLabelText('Size'), { target: { value: '1 kg' } });
  fireEvent.change(screen.getByLabelText('Price (VND)'), { target: { value: '100000' } });
  fireEvent.change(document.getElementById('variant-stock-0'), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add variant' }));
  fireEvent.change(document.getElementById('variant-size-1'), { target: { value: '2 kg' } });
  fireEvent.change(document.getElementById('variant-price-1'), { target: { value: '190000' } });
  fireEvent.change(document.getElementById('variant-stock-1'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save product' }));
  await screen.findByText('New demo product');
  expect(requests.filter((r) => r.method === 'post' && r.url === '/store/products/24/variants')).toHaveLength(2);
});

it('hiển thị lỗi API mà không làm trắng trang hoặc gọi map trên object', async () => {
  const adapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async (config) => {
    if (config.url !== '/store/products') return adapter(config);
    throw new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', config, null, {
      status: 503, data: { error: { message: 'Products unavailable' } },
    });
  };
  renderPage();
  expect((await screen.findByRole('alert')).textContent).toBe('Products unavailable');
  expect(screen.getByRole('heading', { name: 'Products', exact: true })).toBeTruthy();
});
