const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, describe, test } = require('node:test');
const bcrypt = require('bcryptjs');

// Yêu cầu truyền riêng URL của database test.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('Cần đặt TEST_DATABASE_URL trỏ tới database test.');
}

// Cấu hình môi trường trước khi import database và ứng dụng.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_SSL_CA_PATH = '';

const pool = require('../src/config/db');
const app = require('../src/app');

let server;
let baseUrl;

// Tạo tên riêng cho dữ liệu của mỗi lần chạy test.
const suffix = Date.now();
const adminEmail = `admin-${suffix}@example.com`;
const memberEmail = `member-${suffix}@example.com`;
const expiredMemberEmail = `expired-${suffix}@example.com`;

// Gửi HTTP request tới server test và đọc JSON trả về.
async function request(method, path, body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    json: await response.json(),
  };
}

// Chuẩn bị tài khoản mẫu và khởi động server trước khi test.
before(async () => {
  const adminHash = await bcrypt.hash('Admin@123456', 10);

  // Tạo Admin trực tiếp trong database.
  await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'admin')
    `,
    [adminEmail, adminHash, 'Admin Test']
  );

  // Tạo member có gói active.
  const memberHash = await bcrypt.hash('Member@123456', 10);
  await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'member')
    `,
    [memberEmail, memberHash, 'Member Active Test']
  );

  // Tạo member không có gói active (hết hạn).
  const expiredHash = await bcrypt.hash('Expired@123456', 10);
  await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'member')
    `,
    [expiredMemberEmail, expiredHash, 'Member Expired Test']
  );

  // Thêm gói active cho member.
  await pool.query(
    `
      INSERT INTO membership_plans (name, duration_days, price, status)
      VALUES ('Test Plan', 30, 100000, 'active')
      ON CONFLICT (name) DO NOTHING
    `
  );
  const planResult = await pool.query(
    "SELECT id FROM membership_plans WHERE name = 'Test Plan'"
  );
  const planId = planResult.rows[0].id;

  const memberResult = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [memberEmail]
  );
  const memberId = memberResult.rows[0].id;

  await pool.query(
    `
      INSERT INTO memberships (user_id, plan_id, start_date, end_date, status)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'active')
    `,
    [memberId, planId]
  );

  // Dùng cổng ngẫu nhiên để không trùng server đang chạy trên máy.
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// Đóng server và kết nối database sau khi test kết thúc.
after(async () => {
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  } finally {
    await pool.end();
  }
});

describe('Check-in API', () => {
  let adminToken;
  let memberToken;

  test('admin login returns an access token', async () => {
    const result = await request('POST', '/api/auth/login', {
      email: adminEmail,
      password: 'Admin@123456',
    });

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.data.user.role, 'admin');
    assert.ok(result.json.data.access_token);

    adminToken = result.json.data.access_token;
  });

  test('member login returns an access token', async () => {
    const result = await request('POST', '/api/auth/login', {
      email: memberEmail,
      password: 'Member@123456',
    });

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.data.user.role, 'member');
    assert.ok(result.json.data.access_token);

    memberToken = result.json.data.access_token;
  });

  test('check-in without token returns 401', async () => {
    const result = await request('POST', '/api/checkins', { user_id: 1 });

    assert.equal(result.status, 401, JSON.stringify(result.json));
  });

  test('member cannot check-in (returns 403)', async () => {
    const result = await request(
      'POST',
      '/api/checkins',
      { user_id: 1 },
      memberToken
    );

    assert.equal(result.status, 403, JSON.stringify(result.json));
  });

  test('admin can check-in a member with valid membership returns 201', async () => {
    // Lấy user_id của member active
    const memberResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [memberEmail]
    );
    const memberId = memberResult.rows[0].id;

    const result = await request(
      'POST',
      '/api/checkins',
      { user_id: memberId },
      adminToken
    );

    assert.equal(result.status, 201, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.ok(result.json.data.id);
    assert.equal(result.json.data.user_id, memberId);
  });

  test('admin check-in for member without active membership returns 400', async () => {
    // Lấy user_id của member expired (không có gói active)
    const expiredResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [expiredMemberEmail]
    );
    const expiredId = expiredResult.rows[0].id;

    const result = await request(
      'POST',
      '/api/checkins',
      { user_id: expiredId },
      adminToken
    );

    assert.equal(result.status, 400, JSON.stringify(result.json));
    assert.equal(result.json.error.code, 'MEMBERSHIP_EXPIRED');
  });

  test('admin check-in with missing user_id returns 400', async () => {
    const result = await request('POST', '/api/checkins', {}, adminToken);

    assert.equal(result.status, 400, JSON.stringify(result.json));
    assert.equal(result.json.error.code, 'VALIDATION_ERROR');
  });

  test('admin check-in with invalid user_id returns 400', async () => {
    const result = await request(
      'POST',
      '/api/checkins',
      { user_id: 'abc' },
      adminToken
    );

    assert.equal(result.status, 400, JSON.stringify(result.json));
    assert.equal(result.json.error.code, 'VALIDATION_ERROR');
  });

  test('admin can get today check-ins', async () => {
    const result = await request('GET', '/api/checkins/today', null, adminToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.ok(Array.isArray(result.json.data));
  });

  test('member cannot get today check-ins (returns 403)', async () => {
    const result = await request('GET', '/api/checkins/today', null, memberToken);

    assert.equal(result.status, 403, JSON.stringify(result.json));
  });
});
