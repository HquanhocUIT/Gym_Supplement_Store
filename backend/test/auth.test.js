const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, describe, test } = require('node:test');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
}

const suffix = Date.now();

describe('Auth & permissions', () => {
  let adminToken;
  let memberToken;

  test('POST /api/auth/register ignores role and creates member', async () => {
    const res = await request('POST', '/api/auth/register', {
      email: `admin-${suffix}@example.com`,
      password: 'Admin@123456',
      full_name: 'Admin User',
      role: 'admin',
    });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    assert.equal(res.json.data.user.role, 'member');
  });

  test('POST /api/auth/register creates member by default', async () => {
    const res = await request('POST', '/api/auth/register', {
      email: `member-${suffix}@example.com`,
      password: 'Member@123456',
      full_name: 'Member User',
    });
    assert.equal(res.status, 201, JSON.stringify(res.json));
    assert.equal(res.json.data.user.role, 'member');
  });

  test('POST /api/auth/login admin', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: `admin-${suffix}@example.com`,
      password: 'Admin@123456',
    });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    assert.ok(res.json.data.access_token);
    adminToken = res.json.data.access_token;
  });

  test('POST /api/auth/login member', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: `member-${suffix}@example.com`,
      password: 'Member@123456',
    });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    assert.ok(res.json.data.access_token);
    memberToken = res.json.data.access_token;
  });

  test('no token returns 401', async () => {
    const res = await request('GET', '/api/members');
    assert.equal(res.status, 401);
  });

  test('member using admin API returns 403', async () => {
    const res = await request('POST', '/api/plans', {
      name: `Member Plan ${suffix}`,
      duration_days: 30,
      price: 100000,
    }, memberToken);
    assert.equal(res.status, 403, JSON.stringify(res.json));
  });

  test('admin request succeeds', async () => {
    const res = await request('POST', '/api/plans', {
      name: `Admin Plan ${suffix}`,
      duration_days: 30,
      price: 100000,
    }, adminToken);
    assert.equal(res.status, 201, JSON.stringify(res.json));
    assert.equal(res.json.data.status, 'active');
    assert.ok(res.json.data.id);
  });
});
