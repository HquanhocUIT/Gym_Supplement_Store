const orderRepository = require('../repositories/orderRepository');
const orderWebhookService = require('./orderWebhookService');

// Tạo lỗi đầu vào để API trả status và code cụ thể.
function createServiceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// Kiểm tra user ID lấy từ JWT trước khi gọi repository.
function parseUserId(value) {
  const userId = Number(value);

  if (!Number.isSafeInteger(userId) || userId < 1 || userId > 2147483647) {
    throw createServiceError(400, 'INVALID_USER_ID', 'user_id phải là số nguyên dương.');
  }

  return userId;
}

// Chuẩn hóa và kiểm tra thông tin người nhận cùng phương thức COD.
function validateShipping(input = {}) {
  // Body rỗng hoặc null sẽ trả lỗi 400 thay vì làm service phát sinh lỗi 500.
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};

  const recipientName = typeof input.recipient_name === 'string' ? input.recipient_name.trim() : '';
  const recipientPhone = typeof input.recipient_phone === 'string' ? input.recipient_phone.trim() : '';
  const shippingAddress = typeof input.shipping_address === 'string' ? input.shipping_address.trim() : '';
  const paymentMethod = typeof input.payment_method === 'string' ? input.payment_method.trim().toLowerCase() : '';

  if (!recipientName || recipientName.length > 255) {
    throw createServiceError(400, 'INVALID_RECIPIENT_NAME', 'recipient_name là bắt buộc và tối đa 255 ký tự.');
  }

  if (!recipientPhone || recipientPhone.length > 30) {
    throw createServiceError(400, 'INVALID_RECIPIENT_PHONE', 'recipient_phone là bắt buộc và tối đa 30 ký tự.');
  }

  if (!shippingAddress) {
    throw createServiceError(400, 'INVALID_SHIPPING_ADDRESS', 'shipping_address là bắt buộc.');
  }

  if (paymentMethod !== 'cod') {
    throw createServiceError(400, 'UNSUPPORTED_PAYMENT_METHOD', 'Task này chỉ hỗ trợ thanh toán COD.');
  }

  return { recipientName, recipientPhone, shippingAddress };
}

// Tạo đơn COD sau khi xác thực người dùng và dữ liệu giao hàng.
exports.createOrder = async (userId, input) => {
  const parsedUserId = parseUserId(userId);
  const shipping = validateShipping(input);

  const created = await orderRepository.createCodOrder(parsedUserId, shipping);
  const { customerEmail, ...responseData } = created;

  if (customerEmail) {
    try {
      await orderWebhookService.notifyOrderCreated({
        customerEmail,
        order: created.order,
      });
    } catch {
      console.warn(`Could not start the order-created notification for order ${created.order.id}.`);
    }
  }

  return responseData;
};

// Chấp nhận số nguyên dương đúng định dạng, không cắt phần thập phân hoặc hậu tố.
function positiveInteger(value, fallback, maximum, field) {
  if (value === undefined) return fallback;
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value))
      || Number(value) < 1 || Number(value) > maximum) {
    throw createServiceError(400, 'INVALID_PARAMETER', `${field} must be a valid positive integer.`);
  }
  return Number(value);
}

// Chủ tài khoản luôn lấy từ phiên xác thực; bỏ qua user_id trong query.
exports.listOwnOrders = (userId, query = {}) => orderRepository.listOwnOrders(
  parseUserId(userId),
  positiveInteger(query.page, 1, 2147483647, 'page'),
  positiveInteger(query.limit, 12, 100, 'limit'),
);

exports.getOwnOrder = async (userId, id) => {
  const orderId = positiveInteger(id, undefined, 2147483647, 'order ID');
  const order = await orderRepository.getOwnOrder(parseUserId(userId), orderId);
  if (!order) throw createServiceError(404, 'ORDER_NOT_FOUND', 'Order not found.');
  return order;
};
