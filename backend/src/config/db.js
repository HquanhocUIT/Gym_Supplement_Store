require('./env');
const { Pool } = require('pg');
const getDatabaseOptions = require('./dbOptions');

// Dùng chung một Pool. Chưa mở kết nối cho đến khi có truy vấn đầu tiên.
// DATABASE_URL được ưu tiên; nếu để trống, pg đọc các biến PG* cho database local.
const pool = new Pool(getDatabaseOptions());

pool.on('error', () => {
  // Chỉ ghi thông báo chung, không ghi URL hay mật khẩu ra log.
  console.error('Có lỗi ở kết nối PostgreSQL đang chờ trong Pool.');
});

module.exports = pool;
