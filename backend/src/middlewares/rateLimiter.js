const rateLimit = require('express-rate-limit');

/**
 * Giới hạn số lần thử đăng nhập để chống brute-force.
 * Mỗi IP chỉ được thử tối đa 5 lần trong 15 phút.
 * Trả về đúng cấu trúc lỗi chung của API khi vượt giới hạn.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.',
    },
  },
});

module.exports = { loginLimiter };
