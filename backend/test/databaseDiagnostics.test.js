const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getDatabaseErrorCode } = require('../src/services/databaseDiagnostics');

// Phân biệt lỗi xác thực, mạng và CA mà không cần truy cập database thật.
test('giữ các mã lỗi kết nối đã biết', () => {
  for (const code of ['28P01', 'ECONNREFUSED', 'ENETUNREACH', 'SELF_SIGNED_CERT_IN_CHAIN', 'ERR_TLS_CERT_ALTNAME_INVALID']) {
    assert.equal(getDatabaseErrorCode({ code }), code);
  }
});

test('đọc được lỗi driver bọc trong cause và AggregateError', () => {
  assert.equal(getDatabaseErrorCode({ cause: { code: 'CERT_HAS_EXPIRED' } }), 'CERT_HAS_EXPIRED');
  assert.equal(getDatabaseErrorCode(new AggregateError([{ code: 'ENOTFOUND' }])), 'ENOTFOUND');
});

test('nhận diện timeout và tenant pooler bằng nhãn cố định', () => {
  assert.equal(getDatabaseErrorCode(new Error('Connection terminated due to connection timeout')), 'CONNECTION_TIMEOUT');
  assert.equal(getDatabaseErrorCode(new Error('Tenant or user not found')), 'POOLER_TENANT_NOT_FOUND');
});

// Mã lỗi lạ, message và stack có thể chứa credential nên tuyệt đối không trả nguyên văn.
test('không trả URL, mật khẩu hoặc code tùy ý trong chẩn đoán', () => {
  const privateValue = 'postgresql://example:private-password@example.invalid/postgres';
  assert.equal(getDatabaseErrorCode({ code: privateValue, message: privateValue, stack: privateValue }), 'UNKNOWN_DATABASE_ERROR');
  assert.equal(getDatabaseErrorCode({ code: '28P01', message: privateValue }), '28P01');
  assert.equal(getDatabaseErrorCode(new Error('timeout ' + privateValue)), 'CONNECTION_TIMEOUT');
  assert.equal(getDatabaseErrorCode(null), 'UNKNOWN_DATABASE_ERROR');
});
