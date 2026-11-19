import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './apiClient.js'
import { addCartItem, deleteCartItem, getCart, updateCartItem } from './cartApi.js'

const originalAdapter = apiClient.defaults.adapter

// Giả lập API để kiểm tra method, URL, body và Authorization mà không cần server.
function mockSuccessAdapter(onRequest = () => {}) {
  apiClient.defaults.adapter = vi.fn(async (config) => {
    onRequest(config)
    return {
      data: { success: true, data: { id: 8, items: [], subtotal: '0' }, error: null },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  })
}

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  vi.unstubAllGlobals()
})

describe('cart API', () => {
  it('gets the current cart', async () => {
    let receivedConfig
    mockSuccessAdapter((config) => { receivedConfig = config })

    await expect(getCart()).resolves.toEqual({ id: 8, items: [], subtotal: '0' })
    expect(receivedConfig.method).toBe('get')
    expect(receivedConfig.url).toBe('/store/cart')
  })

  it('sends variant ID and quantity when adding an item', async () => {
    let receivedConfig
    mockSuccessAdapter((config) => { receivedConfig = config })

    await addCartItem(5, 2)
    expect(receivedConfig.method).toBe('post')
    expect(receivedConfig.url).toBe('/store/cart/items')
    expect(JSON.parse(receivedConfig.data)).toEqual({ variant_id: 5, quantity: 2 })
  })

  it('updates and deletes a cart row by its ID', async () => {
    const requests = []
    mockSuccessAdapter((config) => requests.push(config))

    await updateCartItem(12, 3)
    await deleteCartItem(12)

    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ['put', '/store/cart/items/12'],
      ['delete', '/store/cart/items/12'],
    ])
    expect(JSON.parse(requests[0].data)).toEqual({ quantity: 3 })
  })

  it('adds the saved access token to private requests', async () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'test-jwt' } })
    let receivedAuthorization
    mockSuccessAdapter((config) => {
      receivedAuthorization = config.headers.get('Authorization')
    })

    await getCart()
    expect(receivedAuthorization).toBe('Bearer test-jwt')
  })
})
