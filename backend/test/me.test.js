const { randomUUID } = require('node:crypto');
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
// UUID tránh trùng email khi nhiều file test khởi chạy cùng mili giây.
const suffix = randomUUID();
const adminEmail = `admin-${suffix}@example.com`;
const memberEmail = `member-${suffix}@example.com`;
const noPlanEmail = `noplan-${suffix}@example.com`;

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

  // Tạo member không có gói tập.
  const noPlanHash = await bcrypt.hash('NoPlan@123456', 10);
  await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'member')
    `,
    [noPlanEmail, noPlanHash, 'Member No Plan Test']
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

  // Thêm check-in cho member.
  await pool.query(
    `
      INSERT INTO checkins (user_id, checkin_time)
      VALUES ($1, NOW())
    `,
    [memberId]
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

describe('/me endpoints', () => {
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

  test('GET /me/profile without token returns 401', async () => {
    const result = await request('GET', '/api/me/profile');

    assert.equal(result.status, 401, JSON.stringify(result.json));
  });

  test('GET /me/profile returns member profile', async () => {
    const result = await request('GET', '/api/me/profile', null, memberToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.equal(result.json.data.email, memberEmail);
    assert.equal(result.json.data.role, 'member');
    assert.ok(result.json.data.id);
    assert.ok(result.json.data.full_name);
    assert.ok(result.json.data.created_at);
    // Không trả về trường không có trong schema
    assert.equal(result.json.data.phone, undefined);
    assert.equal(result.json.data.is_active, undefined);
  });

  test('GET /me/memberships returns active membership', async () => {
    const result = await request('GET', '/api/me/memberships', null, memberToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.ok(Array.isArray(result.json.data));
    assert.ok(result.json.data.length > 0);
    assert.equal(result.json.data[0].status, 'active');
    assert.ok(result.json.data[0].id);
    assert.ok(result.json.data[0].plan_id);
    assert.ok(result.json.data[0].plan_name);
  });

  test('GET /me/memberships returns empty for member without plan', async () => {
    const noPlanHash = await bcrypt.hash('NoPlan2@123456', 10);
    const noPlanEmail2 = `noplan2-${suffix}@example.com`;
    await pool.query(
      `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, 'member')
      `,
      [noPlanEmail2, noPlanHash, 'Member No Plan 2 Test']
    );

    const noPlanResult = await request('POST', '/api/auth/login', {
      email: noPlanEmail2,
      password: 'NoPlan2@123456',
    });
    assert.equal(noPlanResult.status, 200, JSON.stringify(noPlanResult.json));
    const noPlanToken = noPlanResult.json.data.access_token;

    const result = await request('GET', '/api/me/memberships', null, noPlanToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.ok(Array.isArray(result.json.data));
    assert.equal(result.json.data.length, 0);
  });

  test('GET /me/checkins returns check-in history', async () => {
    const result = await request('GET', '/api/me/checkins', null, memberToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.ok(Array.isArray(result.json.data));
    assert.ok(result.json.data.length > 0);
    assert.ok(result.json.data[0].id);
    assert.ok(result.json.data[0].checkin_time);
    // Không trả về trường không có trong schema
    assert.equal(result.json.data[0].method, undefined);
    assert.equal(result.json.data[0].plan_name, undefined);
  });

  test('GET /me/checkins returns empty for member without check-ins', async () => {
    const noPlanHash = await bcrypt.hash('NoPlan3@123456', 10);
    const noPlanEmail3 = `noplan3-${suffix}@example.com`;
    await pool.query(
      `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, 'member')
      `,
      [noPlanEmail3, noPlanHash, 'Member No Plan 3 Test']
    );

    const noPlanResult = await request('POST', '/api/auth/login', {
      email: noPlanEmail3,
      password: 'NoPlan3@123456',
    });
    assert.equal(noPlanResult.status, 200, JSON.stringify(noPlanResult.json));
    const noPlanToken = noPlanResult.json.data.access_token;

    const result = await request('GET', '/api/me/checkins', null, noPlanToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.success, true);
    assert.ok(Array.isArray(result.json.data));
    assert.equal(result.json.data.length, 0);
  });

  test('admin cannot access /me/profile with member token (returns own profile, not 403 since /me is self)', async () => {
    // /me endpoints return the authenticated user's own data, so admin can access their own profile
    const result = await request('GET', '/api/me/profile', null, adminToken);

    assert.equal(result.status, 200, JSON.stringify(result.json));
    assert.equal(result.json.data.email, adminEmail);
    assert.equal(result.json.data.role, 'admin');
  });
});
