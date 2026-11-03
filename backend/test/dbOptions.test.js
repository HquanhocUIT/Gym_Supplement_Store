const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const getDatabaseOptions = require('../src/config/dbOptions');

// Cấu hình local không bắt buộc SSL và vẫn giữ cách đọc các biến PG* của pg.
test('local dùng các biến PG* khi DATABASE_URL trống', () => {
  const options = getDatabaseOptions({ DATABASE_URL: '', DATABASE_SSL: 'false' });
  assert.equal(options.connectionString, undefined);
  assert.equal(options.ssl, false);
});

test('Supabase cần SSL và luôn xác thực chứng chỉ', () => {
  const env = { DATABASE_URL: 'postgresql://db.example.supabase.co/postgres', DATABASE_SSL: 'true' };
  assert.equal(getDatabaseOptions(env).ssl.rejectUnauthorized, true);
  assert.throws(() => getDatabaseOptions({ ...env, DATABASE_SSL: 'false' }), /Supabase cần DATABASE_SSL=true/);
});

// Các tham số URL không được phép âm thầm tắt SSL hoặc bỏ xác thực chứng chỉ.
test('không cho tham số URL ghi đè SSL', () => {
  for (const query of ['sslmode=disable', 'sslmode=no-verify', 'ssl=false', 'sslrootcert=missing.crt']) {
    assert.throws(() => getDatabaseOptions({ DATABASE_URL: `postgresql://localhost/postgres?${query}`, DATABASE_SSL: 'true' }), /Bỏ tham số SSL/);
  }
});

test('đọc được CA từ file cấu hình và vẫn giữ xác thực chứng chỉ', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-task7-ca-'));
  const certificate = path.join(directory, 'test-ca.crt');
  try {
    fs.writeFileSync(certificate, 'noi-dung-ca-gia-lap');
    const options = getDatabaseOptions({ DATABASE_SSL: 'true', DATABASE_SSL_CA_PATH: certificate });
    assert.equal(options.ssl.ca, 'noi-dung-ca-gia-lap');
    assert.equal(options.ssl.rejectUnauthorized, true);
  } finally {
    // Chỉ xóa hai đường dẫn tạm đã tạo trong test, không xóa đệ quy thư mục khác.
    fs.unlinkSync(certificate);
    fs.rmdirSync(directory);
  }
});

test('URL sai không làm lộ chuỗi kết nối trong thông báo lỗi', () => {
  const privateValue = 'gia-tri-rieng-tu';
  assert.throws(() => getDatabaseOptions({ DATABASE_URL: privateValue }), (error) => {
    assert.equal(error.message.includes(privateValue), false);
    return true;
  });
});

test('báo rõ lỗi cấu hình SSL và đường dẫn CA', () => {
  assert.throws(() => getDatabaseOptions({ DATABASE_SSL: 'yes' }), /chỉ nhận true hoặc false/);
  assert.throws(() => getDatabaseOptions({ DATABASE_SSL: 'true', DATABASE_SSL_CA_PATH: 'missing-ca.crt' }), /Không đọc được chứng chỉ CA/);
});
