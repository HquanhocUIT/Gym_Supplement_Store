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
  // Tạo Admin trực tiếp trong database vì đăng ký công khai chỉ tạo member.
  const adminHash = await bcrypt.hash('Admin@123456', 10);

  await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'admin')
    `,
    [adminEmail, adminHash, 'Admin Test']
  );

  // Tạo member để kiểm tra đăng nhập và giới hạn quyền.
  const memberHash = await bcrypt.hash('Member@123456', 10);

  await pool.query(
    `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, 'member')
    `,
    [memberEmail, memberHash, 'Member Test']
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

describe('Auth & permissions', () => {
  let adminToken;
  let memberToken;

  // Gửi role admin khi đăng ký vẫn phải tạo tài khoản member.
  test('register ignores role and creates member', async () => {
    const result = await request('POST', '/api/auth/register', {
      email: `reg-admin-${suffix}@example.com`,
      password: 'Admin@123456',
      full_name: 'Register Test',
      role: 'admin',
    });

    assert.equal(result.status, 201, JSON.stringify(result.json));
    assert.equal(result.json.data.user.role, 'member');
  });

  // Không truyền role thì tài khoản mới vẫn mặc định là member.
  test('register creates member by default', async () => {
    const result = await request('POST', '/api/auth/register', {
      email: `reg-member-${suffix}@example.com`,
      password: 'Member@123456',
      full_name: 'Register Member Test',
    });

    assert.equal(result.status, 201, JSON.stringify(result.json));
    assert.equal(result.json.data.user.role, 'member');
  });

  // Đăng nhập bằng Admin đã tạo trực tiếp trong database.
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

  // Đăng nhập bằng member để lấy token kiểm tra quyền.
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

  // Route yêu cầu đăng nhập phải từ chối request không có token.
  test('request without token returns 401', async () => {
    const result = await request('GET', '/api/members');

    assert.equal(result.status, 401, JSON.stringify(result.json));
  });

  // Member không được phép tạo gói tập dành cho Admin.
  test('member using an Admin API returns 403', async () => {
    const result = await request(
      'POST',
      '/api/plans',
      {
        name: `Member Plan ${suffix}`,
        duration_days: 30,
        price: 100000,
      },
      memberToken
    );

    assert.equal(result.status, 403, JSON.stringify(result.json));
  });

  // Admin được phép tạo gói tập và nhận dữ liệu đúng schema.
  test('admin can create a membership plan', async () => {
    const result = await request(
      'POST',
      '/api/plans',
      {
        name: `Admin Plan ${suffix}`,
        duration_days: 30,
        price: 100000,
      },
      adminToken
    );

    assert.equal(result.status, 201, JSON.stringify(result.json));
    assert.equal(result.json.data.status, 'active');
    assert.ok(result.json.data.id);
  });
});