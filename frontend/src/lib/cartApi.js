import { getApiData, requestApiData } from './apiClient.js'

// Lấy giỏ hàng hiện tại của tài khoản đang đăng nhập.
export function getCart() {
  return getApiData('/store/cart')
}

// Thêm phiên bản sản phẩm vào giỏ.
export function addCartItem(variantId, quantity) {
  return requestApiData('post', '/store/cart/items', {
    variant_id: variantId,
    quantity,
  })
}

// Đổi số lượng của một dòng trong giỏ.
export function updateCartItem(itemId, quantity) {
  return requestApiData('put', `/store/cart/items/${itemId}`, { quantity })
}

// Xóa một dòng khỏi giỏ.
export function deleteCartItem(itemId) {
  return requestApiData('delete', `/store/cart/items/${itemId}`)
}
