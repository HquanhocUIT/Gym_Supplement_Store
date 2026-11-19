const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { after, test } = require('node:test');

// Integration test chạy trên database tạm của CI; máy local không cần database riêng.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  test('checkout PostgreSQL integration requires TEST_DATABASE_URL', { skip: true }, () => {});
} else {
  // Trỏ pool test vào PostgreSQL tạm, không dùng database trong cấu hình local.
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DATABASE_SSL = 'false';
  process.env.DATABASE_SSL_CA_PATH = '';

  const pool = require('../src/config/db');
  const orderRepository = require('../src/repositories/orderRepository');

  after(async () => {
    await pool.end();
  });

  test('PostgreSQL checkout saves COD order, discounts member and preserves cart on stock conflict', async () => {
    const suffix = randomUUID();
    let userId;
    let planId;
    let categoryId;

    try {
      const userResult = await pool.query({
        text: `
          INSERT INTO users (email, password_hash, full_name, role)
          VALUES ($1, 'integration-test-hash', 'Checkout Test', 'member')
          RETURNING id
        `,
        values: [`checkout-${suffix}@example.com`],
      });
      userId = userResult.rows[0].id;

      const planResult = await pool.query({
        text: `
          INSERT INTO membership_plans (name, duration_days, price, status)
          VALUES ($1, 30, 100.00, 'active')
          RETURNING id
        `,
        values: [`Checkout Test ${suffix}`],
      });
      planId = planResult.rows[0].id;

      await pool.query({
        text: `
          INSERT INTO memberships (user_id, plan_id, start_date, end_date, status)
          VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + 30, 'active')
        `,
        values: [userId, planId],
      });

      const categoryResult = await pool.query({
        text: 'INSERT INTO categories (name) VALUES ($1) RETURNING id',
        values: [`Checkout Test ${suffix}`],
      });
      categoryId = categoryResult.rows[0].id;

      const productResult = await pool.query({
        text: 'INSERT INTO products (category_id, name) VALUES ($1, $2) RETURNING id',
        values: [categoryId, `Checkout Whey ${suffix}`],
      });
      const productId = productResult.rows[0].id;

      const stockedVariantResult = await pool.query({
        text: `
          INSERT INTO product_variants (product_id, flavor, size, price, stock)
          VALUES ($1, 'Vanilla', '1 kg', 100.00, 10)
          RETURNING id
        `,
        values: [productId],
      });
      const stockedVariantId = stockedVariantResult.rows[0].id;

      const cartResult = await pool.query({
        text: 'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
        values: [userId],
      });
      const cartId = cartResult.rows[0].id;

      await pool.query({
        text: 'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, 2)',
        values: [cartId, stockedVariantId],
      });

      const order = await orderRepository.createCodOrder(userId, {
        recipientName: 'Checkout Test',
        recipientPhone: '0900000000',
        shippingAddress: 'Test address',
      });

      assert.equal(order.order.subtotal, '200.00');
      assert.equal(order.order.discount_amount, '20.00');
      assert.equal(order.order.total_amount, '180.00');
      assert.equal(order.payment.payment_method, 'cod');
      assert.equal(order.payment.status, 'pending');
      assert.equal(order.order.items.length, 1);

      const stockAfterCheckout = await pool.query({
        text: 'SELECT stock FROM product_variants WHERE id = $1',
        values: [stockedVariantId],
      });
      const cartAfterCheckout = await pool.query({
        text: 'SELECT count(*)::integer AS item_count FROM cart_items WHERE cart_id = $1',
        values: [cartId],
      });
      assert.equal(stockAfterCheckout.rows[0].stock, 8);
      assert.equal(cartAfterCheckout.rows[0].item_count, 0);

      const shortVariantResult = await pool.query({
        text: `
          INSERT INTO product_variants (product_id, flavor, size, price, stock)
          VALUES ($1, 'Chocolate', '1 kg', 80.00, 1)
          RETURNING id
        `,
        values: [productId],
      });
      const shortVariantId = shortVariantResult.rows[0].id;
      await pool.query({
        text: 'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1, $2, 2)',
        values: [cartId, shortVariantId],
      });

      await assert.rejects(
        orderRepository.createCodOrder(userId, {
          recipientName: 'Checkout Test',
          recipientPhone: '0900000000',
          shippingAddress: 'Test address',
        }),
        (error) => error.status === 409 && error.code === 'INSUFFICIENT_STOCK',
      );

      const orderCount = await pool.query({
        text: 'SELECT count(*)::integer AS order_count FROM orders WHERE user_id = $1',
        values: [userId],
      });
      const shortStock = await pool.query({
        text: 'SELECT stock FROM product_variants WHERE id = $1',
        values: [shortVariantId],
      });
      const cartCount = await pool.query({
        text: 'SELECT count(*)::integer AS item_count FROM cart_items WHERE cart_id = $1',
        values: [cartId],
      });
      assert.equal(orderCount.rows[0].order_count, 1);
      assert.equal(shortStock.rows[0].stock, 1);
      assert.equal(cartCount.rows[0].item_count, 1);
    } finally {
      if (userId) {
        await pool.query('DELETE FROM payments WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)', [userId]);
        await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = $1)', [userId]);
        await pool.query('DELETE FROM carts WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM memberships WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      }
      if (categoryId) {
        await pool.query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE category_id = $1)', [categoryId]);
        await pool.query('DELETE FROM products WHERE category_id = $1', [categoryId]);
        await pool.query('DELETE FROM categories WHERE id = $1', [categoryId]);
      }
      if (planId) await pool.query('DELETE FROM membership_plans WHERE id = $1', [planId]);
    }
  });
}
