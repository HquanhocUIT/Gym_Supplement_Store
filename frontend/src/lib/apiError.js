// Thông báo giao diện bằng tiếng Anh, vẫn giữ mã lỗi để xử lý nghiệp vụ.
const messages = {
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  EMAIL_EXISTS: 'This email is already registered. Please sign in.',
  UNAUTHORIZED: 'Please sign in to continue.',
  INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INSUFFICIENT_STOCK: 'There is not enough stock. Please review your cart.',
  CART_EMPTY: 'Your cart is empty.',
  INVALID_QUANTITY: 'Quantity must be a positive whole number.',
  INVALID_PRICE_RANGE: 'Minimum price cannot exceed maximum price.',
  INVALID_RECIPIENT_NAME: 'Enter a recipient name of up to 255 characters.',
  INVALID_RECIPIENT_PHONE: 'Enter a phone number of up to 30 characters.',
  INVALID_SHIPPING_ADDRESS: 'Enter a delivery address.',
  MEMBERSHIP_EXPIRED: 'An active membership is required.',
  DATABASE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again.',
};

export function englishApiMessage(message, code, status) {
  if (messages[code]) return messages[code];
  // Lỗi cũ bằng tiếng Việt dùng thông báo theo status thay vì trộn ngôn ngữ.
  if (message && !/[\u00c0-\u024f\u1e00-\u1eff]/i.test(message)) return message;
  if (status === 404) return 'The requested item could not be found.';
  if (status === 400) return 'Please check the entered information.';
  return 'Something went wrong. Please try again.';
}
