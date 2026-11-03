const fs = require('node:fs');
const path = require('node:path');

// Tách phần cấu hình để có thể kiểm tra SSL mà không kết nối database thật.
module.exports = function getDatabaseOptions(env = process.env) {
  const connectionString = env.DATABASE_URL?.trim() || undefined;
  const sslSetting = env.DATABASE_SSL || 'false';

  if (sslSetting !== 'true' && sslSetting !== 'false') {
    throw new Error('DATABASE_SSL chỉ nhận true hoặc false.');
  }

  // Không cho tham số trong URL ghi đè cấu hình SSL ở bên dưới.
  if (connectionString) {
    let url;
    try {
      url = new URL(connectionString);
    } catch {
      throw new Error('DATABASE_URL không hợp lệ. Kiểm tra lại URI PostgreSQL trong .env.');
    }
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
      throw new Error('DATABASE_URL phải dùng giao thức postgres hoặc postgresql.');
    }
    const sslParams = ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslnegotiation'];
    if (sslParams.some((name) => url.searchParams.has(name))) {
      throw new Error('Bỏ tham số SSL khỏi DATABASE_URL; dùng DATABASE_SSL và DATABASE_SSL_CA_PATH.');
    }

    // Supabase luôn dùng SSL; PostgreSQL local có thể để DATABASE_SSL=false.
    const isSupabase = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.com');
    if (isSupabase && sslSetting !== 'true') {
      throw new Error('Kết nối Supabase cần DATABASE_SSL=true.');
    }
  }

  // Khi bật SSL, luôn xác thực chứng chỉ. Đường dẫn CA tương đối tính từ backend/.
  let ssl = false;
  if (sslSetting === 'true') {
    ssl = { rejectUnauthorized: true };
    if (env.DATABASE_SSL_CA_PATH) {
      const caPath = path.resolve(__dirname, '../../', env.DATABASE_SSL_CA_PATH);
      try {
        ssl.ca = fs.readFileSync(caPath, 'utf8');
      } catch {
        throw new Error('Không đọc được chứng chỉ CA. Kiểm tra DATABASE_SSL_CA_PATH.');
      }
    }
  }

  return {
    connectionString,
    ssl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    application_name: 'gym-supplement-store',
  };
};
