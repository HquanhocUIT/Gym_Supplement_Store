const statsService = require('../services/statsService');

// Trả dữ liệu dashboard tổng hợp cho Admin và Staff.
exports.getAdminStats = async (_req, res, next) => {
  try {
    const data = await statsService.getAdminStats();

    // Dashboard chứa dữ liệu nội bộ nên không lưu vào cache của trình duyệt.
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    return next(error);
  }
};
