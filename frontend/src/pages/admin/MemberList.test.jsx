import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AuthProvider } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';
import MemberList from './MemberList';

const originalAdapter = apiClient.defaults.adapter;
let client;
afterEach(() => { cleanup(); client.clear(); localStorage.clear(); apiClient.defaults.adapter = originalAdapter; });
function HistoryControls() {
  const location = useLocation(), navigate = useNavigate();
  return <><output data-testid="url">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Back</button><button onClick={() => navigate(1)}>Forward</button></>;
}
function setup({ fail = false } = {}) {
  localStorage.setItem('user', JSON.stringify({ user_id: 1, role: 'admin' }));
  const members = Array.from({ length: 13 }, (_, i) => ({ id: i + 1, full_name: `Customer ${i + 1}`, email: `customer-${i + 1}@example.test`, status: null }));
  apiClient.defaults.adapter = vi.fn(async (config) => {
    if (fail) throw new AxiosError('Unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { error: { message: 'Members unavailable' } } });
    const { search = '', page, limit } = config.params;
    const filtered = members.filter((member) => member.full_name.toLowerCase().includes(search.toLowerCase()));
    return { config, status: 200, headers: {}, data: { success: true, data: { members: filtered.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } } } };
  });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={['/', '/admin/members']}><HistoryControls /><MemberList /></MemoryRouter></AuthProvider></QueryClientProvider>);
}
it('đọc cấu trúc members/pagination thật và phân trang qua các hội viên còn lại', async () => {
  setup(); await screen.findByText('Customer 1');
  expect(screen.queryByText('Nguyen Van A')).toBeNull();
  expect(screen.getByText('1–10 / 13 results')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
  await screen.findByText('Customer 13');
  expect(screen.getByTestId('url').textContent).toBe('/admin/members?page=2');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await screen.findByText('Customer 1');
  expect(screen.getByTestId('url').textContent).toBe('/admin/members');
});
it('tìm trên toàn bộ hội viên và Back một lần khôi phục danh sách ban đầu', async () => {
  setup(); await screen.findByText('Customer 1');
  const input = screen.getByLabelText('Search members');
  for (const value of ['C', 'Customer', 'Customer 12']) fireEvent.change(input, { target: { value } });
  await screen.findByText('Customer 12');
  expect(screen.queryByText('Customer 1')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await screen.findByText('Customer 1'); expect(input.value).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
  await screen.findByText('Customer 12'); expect(input.value).toBe('Customer 12');
});
it('lỗi API được báo rõ và không hiện danh sách mẫu', async () => {
  setup({ fail: true });
  await screen.findByText('Members unavailable');
  expect(screen.queryByText('Nguyen Van A')).toBeNull();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});
