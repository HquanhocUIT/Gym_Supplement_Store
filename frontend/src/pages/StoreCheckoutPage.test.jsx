import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { apiClient } from '../lib/apiClient.js'
import StoreCheckoutPage from './StoreCheckoutPage.jsx'

const originalAdapter = apiClient.defaults.adapter
let client

// Giỏ nhỏ để kiểm tra checkout qua API client thật, chỉ giả lập đường truyền.
function renderCheckout({ stock = 3, submit } = {}) {
  localStorage.setItem('access_token', 'qa-token')
  apiClient.defaults.adapter = vi.fn(async (config) => {
    if (config.method === 'post') return submit(config)
    return {
      config, status: 200, headers: {}, data: {
        success: true, data: {
          items: [{ id: 1, quantity: 2, variant: { product_name: 'Daily Whey', stock, price: '100000' } }],
          subtotal: '200000',
        },
      },
    }
  })
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(<QueryClientProvider client={client}><MemoryRouter><StoreCheckoutPage /></MemoryRouter></QueryClientProvider>)
}

function fillShipping() {
  fireEvent.change(screen.getByLabelText('Recipient name'), { target: { value: 'Quân QA' } })
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0900000000' } })
  fireEvent.change(screen.getByLabelText('Delivery address'), { target: { value: 'Hồ Chí Minh' } })
}

afterEach(() => {
  cleanup()
  client?.clear()
  localStorage.clear()
  apiClient.defaults.adapter = originalAdapter
})

it('dùng tổng tiền server trả về và không gọi API lịch sử sau checkout', async () => {
  const submit = vi.fn(async (config) => ({
    config, status: 201, headers: {}, data: {
      success: true, data: { order: { id: 17, subtotal: '200000', discount_amount: '0', total_amount: '200000' } },
    },
  }))
  renderCheckout({ submit })
  await screen.findByLabelText('Recipient name')
  expect(screen.queryByText('Total ước tính')).toBeNull()
  fillShipping()
  fireEvent.click(screen.getByRole('button', { name: 'Place order — pay on delivery' }))
  await screen.findByRole('heading', { name: 'Order placed' })
  expect(screen.getByText('Order #17 is awaiting confirmation. Payment is due on delivery.')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Order placed' })).toBe(document.activeElement)
  expect(submit).toHaveBeenCalledTimes(1)
  expect(apiClient.defaults.adapter.mock.calls.some(([c]) => /orders\//.test(c.url))).toBe(false)
})

it('chặn đặt hàng khi số lượng vượt tồn kho', async () => {
  const submit = vi.fn()
  renderCheckout({ stock: 1, submit })
  const button = await screen.findByRole('button', { name: 'Place order — pay on delivery' })
  expect(button.disabled).toBe(true)
  expect(screen.getByRole('alert').textContent).toContain('The quantity exceeds available stock.')
  expect(submit).not.toHaveBeenCalled()
})

it('giữ thông tin giao hàng khi lỗi và cho phép gửi lại', async () => {
  const submit = vi.fn(async () => { throw new Error('Kết nối bị gián đoạn') })
  renderCheckout({ submit })
  await screen.findByLabelText('Recipient name')
  fillShipping()
  fireEvent.click(screen.getByRole('button', { name: 'Place order — pay on delivery' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Recipient name').value).toBe('Quân QA')
  expect(screen.getByLabelText('Delivery address').value).toBe('Hồ Chí Minh')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Place order — pay on delivery' }).disabled).toBe(false))
})

it('khóa nút đặt hàng trong khi request đang xử lý', async () => {
  let finish
  const submit = vi.fn((config) => new Promise((resolve) => { finish = () => resolve({ config, status: 201, headers: {}, data: { success: true, data: { order: { id: 18 } } } }) }))
  renderCheckout({ submit })
  await screen.findByLabelText('Recipient name')
  fillShipping()
  fireEvent.click(screen.getByRole('button', { name: 'Place order — pay on delivery' }))
  expect((await screen.findByRole('button', { name: 'Placing order…' })).disabled).toBe(true)
  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
  finish()
  await screen.findByRole('heading', { name: 'Order placed' })
})
