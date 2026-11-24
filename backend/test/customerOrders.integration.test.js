const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { before, after, test } = require('node:test');
const jwt = require('jsonwebtoken');

// Chỉ dùng PostgreSQL test được truyền rõ ràng, không dùng tài khoản production.
if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required.');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_SSL_CA_PATH = '';
process.env.JWT_SECRET = 'test_secret_key';
const pool = require('../src/config/db');
const app = require('../src/app');
let server, baseUrl, ownerId, otherId, categoryId, orderId, otherOrderId;
let token, otherToken;

async function get(path, auth = token) {
  const response = await fetch(`${baseUrl}/api/store/orders${path}`, {
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  const suffix = randomUUID();
  const users = await pool.query(`INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, 'test-hash', 'Order Owner', 'member'), ($2, 'test-hash', 'Other Account', 'admin') RETURNING id`,
  [`owner-${suffix}@example.test`, `other-${suffix}@example.test`]);
  [ownerId, otherId] = users.rows.map((row) => row.id);
  token = jwt.sign({ user_id: ownerId, role: 'member' }, process.env.JWT_SECRET);
  otherToken = jwt.sign({ user_id: otherId, role: 'admin' }, process.env.JWT_SECRET);
  const category = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [`Orders ${suffix}`]);
  categoryId = category.rows[0].id;
  const product = await pool.query('INSERT INTO products (category_id, name) VALUES ($1, $2) RETURNING id', [categoryId, 'Current catalog name']);
  const variant = await pool.query("INSERT INTO product_variants (product_id, size, price, stock) VALUES ($1, '1 kg', 999, 5) RETURNING id", [product.rows[0].id]);
  const orders = await pool.query(`INSERT INTO orders (user_id, recipient_name, recipient_phone, shipping_address, subtotal, discount_amount, total_amount, status)
    VALUES ($1, 'Owner', '0900000000', 'Owner private address', 200, 20, 180, 'pending'),
      ($1, 'Owner', '0900000000', 'Owner private address', 100, 0, 100, 'delivered'),
      ($2, 'Other', '0900000001', 'Other private address', 100, 0, 100, 'pending') RETURNING id`, [ownerId, otherId]);
  orderId = orders.rows[0].id; otherOrderId = orders.rows[2].id;
  await pool.query(`INSERT INTO order_items (order_id, variant_id, product_name, variant_description, price, quantity)
    VALUES ($1, $2, 'Name at checkout', 'Vanilla · 1 kg', 100, 2)`, [orderId, variant.rows[0].id]);
  await pool.query("INSERT INTO payments (user_id, order_id, amount, payment_method, status) VALUES ($1, $2, 180, 'cod', 'pending')", [ownerId, orderId]);
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (ownerId) {
    await pool.query('DELETE FROM payments WHERE user_id = ANY($1::int[])', [[ownerId, otherId]]);
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ANY($1::int[]))', [[ownerId, otherId]]);
    await pool.query('DELETE FROM orders WHERE user_id = ANY($1::int[])', [[ownerId, otherId]]);
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [[ownerId, otherId]]);
  }
  if (categoryId) {
    await pool.query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE category_id = $1)', [categoryId]);
    await pool.query('DELETE FROM products WHERE category_id = $1', [categoryId]);
    await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
  }
  await pool.end();
});

test('customer order reads require authentication', async () => {
  assert.equal((await get('', null)).status, 401);
  assert.equal((await get(`/${orderId}`, null)).status, 401);
});
test('order list paginates only the authenticated users orders, ignoring injected user_id', async () => {
  const result = await get(`?page=1&limit=1&user_id=${otherId}`);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.items.length, 1);
  assert.equal(result.body.data.pagination.total, 2);
  const second = await get('?page=2&limit=1');
  assert.notEqual(second.body.data.items[0].id, result.body.data.items[0].id);
  assert.ok(![second.body.data.items[0].id, result.body.data.items[0].id].includes(otherOrderId));
});
test('order details preserve checkout snapshot, totals, delivery and payment', async () => {
  const result = await get(`/${orderId}`);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.recipient_name, 'Owner');
  assert.equal(result.body.data.shipping_address, 'Owner private address');
  assert.equal(result.body.data.items[0].product_name, 'Name at checkout');
  assert.equal(result.body.data.items[0].price, '100.00');
  assert.equal(result.body.data.total_amount, '180.00');
  assert.equal(result.body.data.payment.payment_method, 'cod');
});
test('another user including admin cannot read someone elses order through customer API', async () => {
  const member = await get(`/${otherOrderId}`);
  const admin = await get(`/${orderId}`, otherToken);
  assert.equal(member.status, 404);
  assert.equal(admin.status, 404);
  assert.equal(member.body.error.code, 'ORDER_NOT_FOUND');
  assert.ok(!JSON.stringify(member.body).includes('Other private address'));
});
test('invalid page, page size and order IDs return 400', async () => {
  for (const path of ['?page=0', '?limit=101', '?page=1.5', '/abc', '/0', '/2147483648']) {
    assert.equal((await get(path)).status, 400, path);
  }
});
