const healthService = require('../services/healthService');

// Health thông thường vẫn hoạt động ngay cả khi database mất kết nối.
exports.check = (req, res) => {
  res.status(200).json({
    success: true,
    data: healthService.getStatus(),
    error: null,
  });
};

// Kết nối được trả 200; lỗi database trả 503 với thông báo không chứa secret.
exports.checkDatabase = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const data = await healthService.getDatabaseStatus();
    res.status(200).json({ success: true, data, error: null });
  } catch {
    res.status(503).json({
      success: false,
      data: null,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Không thể kết nối database. Kiểm tra cấu hình và thử lại.',
      },
    });
  }
};
