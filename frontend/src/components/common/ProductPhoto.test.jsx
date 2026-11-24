import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import ProductPhoto from './ProductPhoto';
import ProductPhotoEditor from './ProductPhotoEditor';

const originalAdapter = apiClient.defaults.adapter;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
let client;
beforeEach(() => {
  client = new QueryClient();
  URL.createObjectURL = vi.fn(() => 'blob:test-photo');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup(); client.clear(); apiClient.defaults.adapter = originalAdapter;
  URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke;
});

it('ảnh thật được dùng khi có URL; ảnh thiếu hoặc lỗi có nhãn rõ ràng', () => {
  const product = { id: 1, name: 'Daily Whey' };
  const view = render(<ProductPhoto product={product} />);
  expect(screen.getByText('No photo yet')).toBeTruthy();
  view.rerender(<ProductPhoto product={{ ...product, image_url: '/photo.jpg' }} />);
  fireEvent.error(screen.getByAltText('Daily Whey'));
  expect(screen.getByText('No photo yet')).toBeTruthy();
  view.rerender(<ProductPhoto product={{ ...product, image_url: '/replacement.jpg' }} />);
  expect(screen.getByAltText('Daily Whey').getAttribute('src')).toBe('/replacement.jpg');
});
it('upload ảnh cho sản phẩm có sẵn qua field image và làm mới catalog', async () => {
  let upload;
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  apiClient.defaults.adapter = vi.fn(async (config) => {
    upload = config;
    return { config, status: 200, headers: {}, data: { success: true, data: { id: 21, image_url: '/new-photo.jpg' } } };
  });
  render(<QueryClientProvider client={client}><ProductPhotoEditor product={{ id: 21, name: 'Demo' }} /></QueryClientProvider>);
  const file = new File(['image-bytes'], 'whey.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Choose a new photo'), { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }));
  await screen.findByText('Photo saved. It is now used in the shop.');
  expect(upload.url).toBe('/store/products/21/image');
  expect(upload.data.get('image')).toBe(file);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['store-products'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['store-product-detail'] });
});
it('upload lỗi giữ file để thử lại và không báo đã lưu', async () => {
  apiClient.defaults.adapter = vi.fn(async () => { throw new Error('Upload unavailable'); });
  render(<QueryClientProvider client={client}><ProductPhotoEditor product={{ id: 21, name: 'Demo' }} /></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText('Choose a new photo'), { target: { files: [new File(['png'], 'photo.png', { type: 'image/png' })] } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }));
  await screen.findByRole('alert');
  expect(screen.queryByText(/Photo saved/)).toBeNull();
  expect(screen.getByText('photo.png')).toBeTruthy();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Upload photo' }).disabled).toBe(false));
});
