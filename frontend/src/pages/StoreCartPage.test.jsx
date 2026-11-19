import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '../lib/apiClient.js'
import { clearAccessToken } from '../lib/authToken.js'
import PublicLayout from '../layouts/PublicLayout.jsx'
import StoreCartPage from './StoreCartPage.jsx'

const originalAdapter = apiClient.defaults.adapter

function createCart() {
  return {
    id: 9,
    items: [{
      id: 12,
      quantity: 2,
      variant: {
        id: 5,
        product_name: 'Daily Whey',
        image_url: null,
        flavor: 'Vanilla',
        size: '1 kg',
        price: '790000',
        stock: 5,
      },
    }],
    subtotal: '1580000',
  }
}

function renderCart() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/cart" element={<StoreCartPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { ...view, client }
}

afterEach(() => {
  cleanup()
  clearAccessToken()
  apiClient.defaults.adapter = originalAdapter
})

it('đăng nhập, tải giỏ và đồng bộ số lượng mới lên header', async () => {
  window.localStorage.clear()
  let cart = createCart()
  const requests = []

  apiClient.defaults.adapter = vi.fn(async (config) => {
    requests.push({
      method: config.method,
      url: config.url,
      authorization: config.headers.get('Authorization'),
      data: config.data,
    })

    if (config.url === '/auth/login') {
      return { data: { success: true, data: { access_token: 'test-jwt' }, error: null }, status: 200, statusText: 'OK', headers: {}, config }
    }

    if (config.method === 'get' && config.url === '/store/cart') {
      return { data: { success: true, data: cart, error: null }, status: 200, statusText: 'OK', headers: {}, config }
    }

    if (config.method === 'put') {
      const { quantity } = JSON.parse(config.data)
      cart = { ...cart, items: [{ ...cart.items[0], quantity }], subtotal: String(790000 * quantity) }
      return { data: { success: true, data: cart.items[0], error: null }, status: 200, statusText: 'OK', headers: {}, config }
    }

    throw new Error(`Unexpected request: ${config.method} ${config.url}`)
  })

  const { client } = renderCart()
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'member@example.test' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'test-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

  expect(await screen.findByText('Daily Whey')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Giỏ hàng, 2 sản phẩm' })).toBeTruthy()
  expect(requests.find((request) => request.url === '/store/cart')?.authorization).toBe('Bearer test-jwt')

  fireEvent.click(screen.getByRole('button', { name: 'Tăng số lượng Daily Whey' }))
  await waitFor(() => expect(screen.getByText('3 sản phẩm trong giỏ')).toBeTruthy())
  expect(screen.getByRole('link', { name: 'Giỏ hàng, 3 sản phẩm' })).toBeTruthy()
  expect(requests.some((request) => request.method === 'put' && request.url === '/store/cart/items/12')).toBe(true)

  client.clear()
})

it('xóa món và báo trạng thái giỏ trống', async () => {
  window.localStorage.setItem('access_token', 'test-jwt')
  let cart = createCart()

  apiClient.defaults.adapter = vi.fn(async (config) => {
    if (config.method === 'get') {
      return { data: { success: true, data: cart, error: null }, status: 200, statusText: 'OK', headers: {}, config }
    }

    if (config.method === 'delete') {
      cart = { ...cart, items: [], subtotal: '0' }
      return { data: { success: true, data: { id: 12, variant_id: 5 }, error: null }, status: 200, statusText: 'OK', headers: {}, config }
    }

    throw new Error(`Unexpected request: ${config.method} ${config.url}`)
  })

  const { client } = renderCart()
  expect(await screen.findByText('Daily Whey')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Xóa Daily Whey khỏi giỏ' }))

  expect(await screen.findByText('Giỏ hàng đang trống')).toBeTruthy()
  await waitFor(() => expect(screen.getByRole('link', { name: 'Giỏ hàng, 0 sản phẩm' })).toBeTruthy())
  client.clear()
})
