const pool = require('../config/db');

// Truy vấn chỉ đọc, dùng được cả khi database chưa có bảng của ứng dụng.
exports.checkConnection = async () => {
  const result = await pool.query({
    text: 'SELECT NOW() AS checked_at',
    query_timeout: 5000,
  });
  return result.rows[0];
};
