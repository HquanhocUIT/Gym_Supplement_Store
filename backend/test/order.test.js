const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const jwt = require('jsonwebtoken');

// Dùng cổng database không hoạt động; repository sẽ được giả lập trong các test API.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_SSL_CA_PATH = '';
process.env.PGHOST = '127.0.0.1';
process.env.PGPORT = '1';
process.env.JWT_SECRET = 'test_secret_key';

const app = require('../src/app');
const pool = require('../src/config/db');
const orderRepository = require('../src/repositories/orderRepository');

const userId = 42;
const memberToken = jwt.sign({ user_id: userId, role: 'member' }, process.env.JWT_SECRET);
const validOrderBody = {
  recipient_name: 'Quân Nguyễn',
  recipient_phone: '0900000000',
  shipping_address: 'Thành phố Hồ Chí Minh',
  payment_method: 'cod',
};

let server;
let baseUrl;

// Gửi request đến API test và lấy cả status lẫn JSON response.
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

// Dùng cổng ngẫu nhiên để test không va chạm với backend đang chạy.
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// Đóng server và pool sau khi test kết thúc.
after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  await pool.end();
});

test('POST order requires an authenticated user', async () => {
  const result = await request('POST', '/api/store/orders', { body: validOrderBody });

  assert.equal(result.status, 401);
  assert.equal(result.json.error.code, 'UNAUTHORIZED');
});

test('POST order validates COD shipping data before repository access', async (t) => {
  let repositoryCalled = false;
  t.mock.method(orderRepository, 'createCodOrder', async () => {
    repositoryCalled = true;
    return null;
  });

  const missingName = await request('POST', '/api/store/orders', {
    token: memberToken,
    body: { ...validOrderBody, recipient_name: '   ' },
  });
  const unsupportedPayment = await request('POST', '/api/store/orders', {
    token: memberToken,
    body: { ...validOrderBody, payment_method: 'bank_transfer' },
  });
  const nullBody = await request('POST', '/api/store/orders', { token: memberToken, body: null });

  assert.equal(missingName.status, 400);
  assert.equal(missingName.json.error.code, 'INVALID_RECIPIENT_NAME');
  assert.equal(unsupportedPayment.status, 400);
  assert.equal(unsupportedPayment.json.error.code, 'UNSUPPORTED_PAYMENT_METHOD');
  assert.equal(nullBody.status, 400);
  assert.equal(nullBody.json.error.code, 'INVALID_JSON');
  assert.equal(repositoryCalled, false);
});

test('POST order returns the created order and pending COD payment', async (t) => {
  let received;
  const data = {
    order: { id: 15, status: 'pending', subtotal: '100.00', discount_amount: '10.00', total_amount: '90.00', items: [] },
    payment: { id: 23, order_id: 15, amount: '90.00', payment_method: 'cod', status: 'pending' },
  };
  t.mock.method(orderRepository, 'createCodOrder', async (...args) => {
    received = args;
    return data;
  });

  const result = await request('POST', '/api/store/orders', { token: memberToken, body: validOrderBody });

  assert.equal(result.status, 201);
  assert.deepEqual(received, [userId, {
    recipientName: validOrderBody.recipient_name,
    recipientPhone: validOrderBody.recipient_phone,
    shippingAddress: validOrderBody.shipping_address,
  }]);
  assert.deepEqual(result.json.data, data);
});

test('stock conflict from checkout is returned as 409', async (t) => {
  const stockError = new Error('Sản phẩm hiện không còn đủ hàng.');
  stockError.status = 409;
  stockError.code = 'INSUFFICIENT_STOCK';
  t.mock.method(orderRepository, 'createCodOrder', async () => { throw stockError; });

  const result = await request('POST', '/api/store/orders', { token: memberToken, body: validOrderBody });

  assert.equal(result.status, 409);
  assert.equal(result.json.error.code, 'INSUFFICIENT_STOCK');
});

test('checkout rejects insufficient stock and rolls back before creating the order', async (t) => {
  const statements = [];
  const fakeClient = {
    async query(query) {
      const text = typeof query === 'string' ? query : query.text;
      const values = typeof query === 'string' ? undefined : query.values;
      const normalized = text.replace(/\s+/g, ' ').trim();
      statements.push({ text: normalized, values });

      if (normalized === 'BEGIN' || normalized === 'ROLLBACK') return { rows: [] };
      if (normalized.startsWith('SELECT id FROM carts')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('SELECT ci.id AS cart_item_id')) {
        return { rows: [{ cart_item_id: 3, variant_id: 5, quantity: 4, price: '20.00', stock: 3, size: '1 kg', product_name: 'Daily Whey' }] };
      }
      throw new Error(`Unexpected SQL in test: ${normalized}`);
    },
    release() {},
  };
  t.mock.method(pool, 'connect', async () => fakeClient);

  await assert.rejects(
    orderRepository.createCodOrder(userId, {
      recipientName: validOrderBody.recipient_name,
      recipientPhone: validOrderBody.recipient_phone,
      shippingAddress: validOrderBody.shipping_address,
    }),
    (error) => error.status === 409 && error.code === 'INSUFFICIENT_STOCK',
  );

  assert.ok(statements.some(({ text }) => text === 'ROLLBACK'));
  assert.equal(statements.some(({ text }) => text.startsWith('INSERT INTO orders')), false);
  assert.equal(statements.some(({ text }) => text.startsWith('UPDATE product_variants')), false);
});

test('checkout commits order, items, stock deduction, payment and cart cleanup together', async (t) => {
  const statements = [];
  const fakeClient = {
    async query(query) {
      const text = typeof query === 'string' ? query : query.text;
      const values = typeof query === 'string' ? undefined : query.values;
      const normalized = text.replace(/\s+/g, ' ').trim();
      statements.push({ text: normalized, values });

      if (normalized === 'BEGIN' || normalized === 'COMMIT') return { rows: [] };
      if (normalized.startsWith('SELECT id FROM carts')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('SELECT ci.id AS cart_item_id')) {
        return { rows: [{ cart_item_id: 3, variant_id: 5, quantity: 2, price: '50.00', stock: 8, flavor: 'Vanilla', size: '1 kg', product_name: 'Daily Whey' }] };
      }
      if (normalized.startsWith('SELECT COALESCE(SUM')) return { rows: [{ subtotal: '100.00' }] };
      if (normalized.startsWith('SELECT id FROM memberships')) return { rows: [{ id: 7 }] };
      if (normalized.startsWith('SELECT $1::numeric')) {
        assert.deepEqual(values, ['100.00', true]);
        return { rows: [{ subtotal: '100.00', discount_amount: '10.00', total_amount: '90.00' }] };
      }
      if (normalized.startsWith('INSERT INTO orders')) {
        return { rows: [{ id: 15, user_id: userId, subtotal: '100.00', discount_amount: '10.00', total_amount: '90.00', status: 'pending' }] };
      }
      if (normalized.startsWith('INSERT INTO order_items')) {
        return { rows: [{ id: 20, variant_id: 5, product_name: 'Daily Whey', variant_description: 'Vanilla · 1 kg', price: '50.00', quantity: 2 }] };
      }
      if (normalized.startsWith('UPDATE product_variants')) return { rows: [{ id: 5, stock: 6 }] };
      if (normalized.startsWith('INSERT INTO payments')) {
        return { rows: [{ id: 23, user_id: userId, order_id: 15, amount: '90.00', payment_method: 'cod', status: 'pending' }] };
      }
      if (normalized.startsWith('DELETE FROM cart_items') || normalized.startsWith('UPDATE carts')) return { rows: [] };
      throw new Error(`Unexpected SQL in test: ${normalized}`);
    },
    release() {},
  };
  t.mock.method(pool, 'connect', async () => fakeClient);

  const result = await orderRepository.createCodOrder(userId, {
    recipientName: validOrderBody.recipient_name,
    recipientPhone: validOrderBody.recipient_phone,
    shippingAddress: validOrderBody.shipping_address,
  });

  assert.ok(statements.some(({ text }) => text === 'BEGIN'));
  assert.ok(statements.some(({ text }) => text === 'COMMIT'));
  assert.deepEqual(result.order.items, [{
    id: 20,
    variant_id: 5,
    product_name: 'Daily Whey',
    variant_description: 'Vanilla · 1 kg',
    price: '50.00',
    quantity: 2,
  }]);
  assert.equal(result.payment.payment_method, 'cod');
  assert.equal(result.payment.status, 'pending');
  assert.ok(statements.some(({ text, values }) => text.startsWith('UPDATE product_variants') && values[0] === 2));
  assert.ok(statements.some(({ text }) => text.startsWith('DELETE FROM cart_items')));
});

test('checkout rolls back all changes if payment creation fails', async (t) => {
  const statements = [];
  const fakeClient = {
    async query(query, values) {
      const text = typeof query === 'string' ? query : query.text;
      const normalized = text.replace(/\s+/g, ' ').trim();
      statements.push(normalized);

      if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') return { rows: [] };
      if (normalized.startsWith('SELECT id FROM carts')) return { rows: [{ id: 9 }] };
      if (normalized.startsWith('SELECT ci.id AS cart_item_id')) {
        return { rows: [{ cart_item_id: 3, variant_id: 5, quantity: 2, price: '50.00', stock: 8, size: '1 kg', product_name: 'Daily Whey' }] };
      }
      if (normalized.startsWith('SELECT COALESCE(SUM')) return { rows: [{ subtotal: '100.00' }] };
      if (normalized.startsWith('SELECT id FROM memberships')) return { rows: [] };
      if (normalized.startsWith('SELECT $1::numeric')) return { rows: [{ subtotal: '100.00', discount_amount: '0.00', total_amount: '100.00' }] };
      if (normalized.startsWith('INSERT INTO orders')) return { rows: [{ id: 15 }] };
      if (normalized.startsWith('INSERT INTO order_items')) return { rows: [{ id: 20 }] };
      if (normalized.startsWith('UPDATE product_variants')) return { rows: [{ id: 5, stock: 6 }] };
      if (normalized.startsWith('INSERT INTO payments')) throw new Error('Payment insert failed');
      throw new Error(`Unexpected SQL in test: ${normalized}`);
    },
    release() {},
  };
  t.mock.method(pool, 'connect', async () => fakeClient);

  await assert.rejects(
    orderRepository.createCodOrder(userId, {
      recipientName: validOrderBody.recipient_name,
      recipientPhone: validOrderBody.recipient_phone,
      shippingAddress: validOrderBody.shipping_address,
    }),
    /Payment insert failed/,
  );

  assert.ok(statements.includes('ROLLBACK'));
  assert.equal(statements.includes('COMMIT'), false);
});
