const orderService = require('../services/orderService');

// Tạo đơn hàng và payment COD cho tài khoản đang đăng nhập.
exports.createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrder(req.user.user_id, req.body);

    return res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};
