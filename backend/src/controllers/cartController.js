const cartService = require('../services/cartService');

// Trả giỏ hàng của người dùng hiện đã đăng nhập.
exports.getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.user.user_id);

    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};

// Thêm món vào giỏ và trả thông tin món vừa thêm hoặc cập nhật.
exports.addItem = async (req, res, next) => {
  try {
    const data = await cartService.addItem(req.user.user_id, req.body);

    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};

// Cập nhật số lượng một món thuộc giỏ của người dùng hiện tại.
exports.updateItem = async (req, res, next) => {
  try {
    const data = await cartService.updateItem(req.user.user_id, req.params.itemId, req.body);

    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};

// Xóa món khỏi giỏ của người dùng hiện tại.
exports.deleteItem = async (req, res, next) => {
  try {
    const data = await cartService.deleteItem(req.user.user_id, req.params.itemId);

    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};
