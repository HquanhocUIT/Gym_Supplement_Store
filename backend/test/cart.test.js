const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const jwt = require('jsonwebtoken');

// Dùng database URL không hoạt động; các test giả lập repository nên không mở kết nối thật.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_SSL_CA_PATH = '';
process.env.PGHOST = '127.0.0.1';
process.env.PGPORT = '1';
process.env.JWT_SECRET = 'test_secret_key';

const app = require('../src/app');
const pool = require('../src/config/db');
const cartRepository = require('../src/repositories/cartRepository');

const userId = 42;
const memberToken = jwt.sign({ user_id: userId, role: 'member' }, process.env.JWT_SECRET);

let server;
let baseUrl;

// Gửi request tới server test và trả cả status lẫn JSON.
async function request(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return { status: response.status, json: await response.json() };
}

// Chạy API trên cổng ngẫu nhiên để không va chạm với backend đang chạy.
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// Đóng server và pool sau khi hoàn tất.
after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }

  await pool.end();
});

test('cart routes require a valid login token', async () => {
  const getResponse = await request('GET', '/api/store/cart');
  const postResponse = await request('POST', '/api/store/cart/items', {
    body: { variant_id: 5, quantity: 1 },
  });

  assert.equal(getResponse.status, 401);
  assert.equal(postResponse.status, 401);
});

test('GET cart returns the authenticated user cart', async (t) => {
  let receivedUserId;
  const cart = { id: 9, items: [], subtotal: '0' };

  t.mock.method(cartRepository, 'getCartByUserId', async (id) => {
    receivedUserId = id;
    return cart;
  });

  const result = await request('GET', '/api/store/cart', { token: memberToken });

  assert.equal(result.status, 200);
  assert.equal(receivedUserId, userId);
  assert.deepEqual(result.json.data, cart);
});

test('POST cart item passes the authenticated user, variant and quantity', async (t) => {
  let received;
  const item = { id: 12, quantity: 2, variant: { id: 5, stock: 6 } };

  t.mock.method(cartRepository, 'addCartItem', async (...args) => {
    received = args;
    return item;
  });

  const result = await request('POST', '/api/store/cart/items', {
    token: memberToken,
    body: { variant_id: 5, quantity: 2 },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(received, [userId, 5, 2]);
  assert.deepEqual(result.json.data, item);
});

test('POST cart item rejects a zero quantity before repository access', async (t) => {
  let repositoryCalled = false;
  t.mock.method(cartRepository, 'addCartItem', async () => {
    repositoryCalled = true;
    return null;
  });

  const result = await request('POST', '/api/store/cart/items', {
    token: memberToken,
    body: { variant_id: 5, quantity: 0 },
  });

  assert.equal(result.status, 400);
  assert.equal(result.json.error.code, 'INVALID_QUANTITY');
  assert.equal(repositoryCalled, false);
});

test('stock conflict is returned as 409 INSUFFICIENT_STOCK', async (t) => {
  const stockError = new Error('Tồn kho không đủ.');
  stockError.status = 409;
  stockError.code = 'INSUFFICIENT_STOCK';

  t.mock.method(cartRepository, 'addCartItem', async () => { throw stockError; });

  const result = await request('POST', '/api/store/cart/items', {
    token: memberToken,
    body: { variant_id: 5, quantity: 99 },
  });

  assert.equal(result.status, 409);
  assert.equal(result.json.error.code, 'INSUFFICIENT_STOCK');
});

test('PUT and DELETE operate on item IDs in the authenticated user cart', async (t) => {
  const receivedUpdates = [];
  const receivedDeletes = [];

  t.mock.method(cartRepository, 'updateCartItem', async (...args) => {
    receivedUpdates.push(args);
    return { id: 12, quantity: 3, variant: { id: 5 } };
  });
  t.mock.method(cartRepository, 'deleteCartItem', async (...args) => {
    receivedDeletes.push(args);
    return { id: 12, variant_id: 5 };
  });

  const updateResult = await request('PUT', '/api/store/cart/items/12', {
    token: memberToken,
    body: { quantity: 3 },
  });
  const deleteResult = await request('DELETE', '/api/store/cart/items/12', { token: memberToken });

  assert.equal(updateResult.status, 200);
  assert.deepEqual(receivedUpdates, [[userId, 12, 3]]);
  assert.equal(deleteResult.status, 200);
  assert.deepEqual(receivedDeletes, [[userId, 12]]);
});

test('repository rolls back an add that would exceed stock', async (t) => {
  const statements = [];
  const fakeClient = {
    async query(query, values) {
      const text = typeof query === 'string' ? query : query.text;
      const normalized = text.replace(/\s+/g, ' ').trim();
      statements.push({ text: normalized, values });

      if (normalized === 'BEGIN' || normalized === 'ROLLBACK') return { rows: [] };
      if (normalized.startsWith('INSERT INTO carts')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('SELECT id FROM carts')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('SELECT id, stock FROM product_variants')) {
        return { rows: [{ id: 5, stock: 3 }] };
      }
      if (normalized.startsWith('SELECT id, quantity FROM cart_items')) {
        return { rows: [{ id: 12, quantity: 2 }] };
      }
      if (normalized.startsWith('UPDATE carts')) return { rows: [] };
      throw new Error(`Unexpected SQL in test: ${normalized}`);
    },
    release() {},
  };

  t.mock.method(pool, 'connect', async () => fakeClient);

  await assert.rejects(
    cartRepository.addCartItem(userId, 5, 2),
    (error) => error.status === 409 && error.code === 'INSUFFICIENT_STOCK',
  );

  assert.ok(statements.some(({ text }) => text === 'ROLLBACK'));
  assert.equal(statements.some(({ text }) => text.startsWith('INSERT INTO cart_items')), false);
  assert.equal(statements.some(({ text }) => text.startsWith('UPDATE cart_items')), false);
});

test('repository rolls back an update that would exceed stock', async (t) => {
  const statements = [];
  const fakeClient = {
    async query(query, values) {
      const text = typeof query === 'string' ? query : query.text;
      const normalized = text.replace(/\s+/g, ' ').trim();
      statements.push({ text: normalized, values });

      if (normalized === 'BEGIN' || normalized === 'ROLLBACK') return { rows: [] };
      if (normalized.startsWith('SELECT ci.variant_id, ci.cart_id')) {
        return { rows: [{ variant_id: 5, cart_id: 9 }] };
      }
      if (normalized.startsWith('SELECT id FROM carts')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('SELECT id, stock FROM product_variants')) {
        return { rows: [{ id: 5, stock: 2 }] };
      }
      throw new Error(`Unexpected SQL in test: ${normalized}`);
    },
    release() {},
  };

  t.mock.method(pool, 'connect', async () => fakeClient);

  await assert.rejects(
    cartRepository.updateCartItem(userId, 12, 3),
    (error) => error.status === 409 && error.code === 'INSUFFICIENT_STOCK',
  );

  assert.ok(statements.some(({ text }) => text === 'ROLLBACK'));
  assert.equal(statements.some(({ text }) => text.startsWith('UPDATE cart_items')), false);
});
