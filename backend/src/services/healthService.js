const healthRepository = require('../repositories/healthRepository');

// Kiểm tra tiến trình API, không truy vấn database.
exports.getStatus = () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
});

// Chỉ báo connected sau khi PostgreSQL đã thực sự trả kết quả truy vấn.
exports.getDatabaseStatus = async () => {
  const result = await healthRepository.checkConnection();
  return {
    status: 'ok',
    database: 'connected',
    timestamp: result.checked_at,
  };
};
