import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import PricingPage from './PricingPage';

const originalAdapter = apiClient.defaults.adapter;
let client;
let response;
let fail;

beforeEach(() => {
  response = [{ id: 72, name: 'Custom training pass', duration_days: 45, price: '123400' }];
  fail = false;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  apiClient.defaults.adapter = vi.fn(async (config) => {
    if (fail) throw new Error('Connection unavailable');
    return { config, status: 200, headers: {}, data: { success: true, data: response, error: null } };
  });
});

afterEach(() => {
  cleanup();
  client.clear();
  apiClient.defaults.adapter = originalAdapter;
});

function renderPage() {
  render(<QueryClientProvider client={client}><MemoryRouter><PricingPage /></MemoryRouter></QueryClientProvider>);
}

it('renders actual catalog prices for the full duration, including non-monthly plans', async () => {
  renderPage();
  expect(screen.getByRole('status').textContent).toContain('Loading');
  await screen.findByText('Custom training pass');
  expect(screen.getByText(/123,400/)).toBeTruthy();
  expect(screen.getByText('Total for 45 days')).toBeTruthy();
  expect(screen.queryByText('/month')).toBeNull();
  expect(screen.getByRole('link', { name: 'Register Now' }).getAttribute('href')).toBe('/register');
});

it('explains an empty catalog without substituting sample plans', async () => {
  response = [];
  renderPage();
  await screen.findByText('No membership plans available yet');
  expect(screen.queryByRole('link', { name: 'Register Now' })).toBeNull();
  expect(screen.queryByText('1 Month Pass')).toBeNull();
});

it('shows a failed request and loads actual plans after retry', async () => {
  fail = true;
  renderPage();
  await screen.findByRole('alert');
  expect(screen.queryByText('1 Month Pass')).toBeNull();
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('Custom training pass');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('treats a malformed response as an error rather than an empty catalog', async () => {
  response = { items: [] };
  renderPage();
  await screen.findByRole('alert');
  expect(screen.queryByText('No membership plans available yet')).toBeNull();
});
