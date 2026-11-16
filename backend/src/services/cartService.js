const cartRepository = require('../repositories/cartRepository');

// Tạo lỗi có HTTP status để middleware trả đúng mã lỗi cho API.
function createServiceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// Chuyển ID sang số nguyên dương trước khi truy vấn database.
function parsePositiveInteger(value, fieldName) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 1 || number > 2147483647) {
    throw createServiceError(400, `INVALID_${fieldName.toUpperCase()}`, `${fieldName} phải là số nguyên dương.`);
  }

  return number;
}

// Kiểm tra ID người dùng lấy từ token đã xác thực.
function parseUserId(userId) {
  return parsePositiveInteger(userId, 'user_id');
}

// Kiểm tra số lượng bắt buộc phải là số nguyên dương.
function parseQuantity(value) {
  return parsePositiveInteger(value, 'quantity');
}

// Lấy giỏ và tổng giá trị các món hiện có.
exports.getCart = (userId) => cartRepository.getCartByUserId(parseUserId(userId));

// Thêm một phiên bản vào giỏ sau khi kiểm tra dữ liệu đầu vào.
exports.addItem = (userId, input = {}) => {
  const parsedUserId = parseUserId(userId);
  const variantId = parsePositiveInteger(input.variant_id, 'variant_id');
  const quantity = parseQuantity(input.quantity);

  return cartRepository.addCartItem(parsedUserId, variantId, quantity);
};

// Cập nhật số lượng một món trong giỏ.
exports.updateItem = (userId, itemId, input = {}) => {
  const parsedUserId = parseUserId(userId);
  const parsedItemId = parsePositiveInteger(itemId, 'item_id');
  const quantity = parseQuantity(input.quantity);

  return cartRepository.updateCartItem(parsedUserId, parsedItemId, quantity);
};

// Xóa món khỏi giỏ của đúng người dùng.
exports.deleteItem = async (userId, itemId) => {
  const parsedUserId = parseUserId(userId);
  const parsedItemId = parsePositiveInteger(itemId, 'item_id');
  const deletedItem = await cartRepository.deleteCartItem(parsedUserId, parsedItemId);

  if (!deletedItem) {
    throw createServiceError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy món trong giỏ hàng.');
  }

  return deletedItem;
};
