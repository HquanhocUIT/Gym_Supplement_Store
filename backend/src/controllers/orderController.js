const orderService = require('../services/orderService');

// Đọc lịch sử đơn và chi tiết riêng của tài khoản đang đăng nhập.
exports.listOwnOrders = async (req, res, next) => {
  try {
    const data = await orderService.listOwnOrders(req.user.user_id, req.query);
    return res.json({ success: true, data, error: null });
  } catch (error) { return next(error); }
};

exports.getOwnOrder = async (req, res, next) => {
  try {
    const data = await orderService.getOwnOrder(req.user.user_id, req.params.orderId);
    return res.json({ success: true, data, error: null });
  } catch (error) { return next(error); }
};

// Tạo đơn hàng và payment COD cho tài khoản đang đăng nhập.
exports.createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrder(req.user.user_id, req.body);

    return res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};
