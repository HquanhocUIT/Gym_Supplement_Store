const assert = require('node:assert/strict');
const { test } = require('node:test');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_SSL_CA_PATH = '';
process.env.PGHOST = '127.0.0.1';
process.env.PGPORT = '1';

const pool = require('../src/config/db');
const productRepository = require('../src/repositories/productRepository');

test('deleteProduct removes variants and product in one transaction', async (t) => {
  const statements = [];
  let released = false;
  const product = { id: 7, name: 'Demo', image_url: null };
  const client = {
    async query(query) {
      const sql = typeof query === 'string' ? query : query.text;
      statements.push(sql.trim());
      if (sql.includes('DELETE FROM products')) return { rows: [product] };
      return { rows: [] };
    },
    release() { released = true; },
  };

  t.mock.method(pool, 'connect', async () => client);

  assert.equal(await productRepository.deleteProduct(7), product);
  assert.equal(statements[0], 'BEGIN');
  assert.match(statements[1], /DELETE FROM product_variants/);
  assert.match(statements[2], /DELETE FROM products/);
  assert.equal(statements[3], 'COMMIT');
  assert.equal(released, true);
});

test('deleteProduct rolls back variant deletion when a cart or order references it', async (t) => {
  const statements = [];
  let released = false;
  const foreignKeyError = Object.assign(new Error('foreign key violation'), { code: '23503' });
  const client = {
    async query(query) {
      const sql = typeof query === 'string' ? query : query.text;
      statements.push(sql.trim());
      if (sql.includes('DELETE FROM product_variants')) throw foreignKeyError;
      return { rows: [] };
    },
    release() { released = true; },
  };

  t.mock.method(pool, 'connect', async () => client);

  await assert.rejects(productRepository.deleteProduct(7), (error) => error === foreignKeyError);
  assert.equal(statements[0], 'BEGIN');
  assert.match(statements[1], /DELETE FROM product_variants/);
  assert.equal(statements.includes('COMMIT'), false);
  assert.equal(statements.includes('ROLLBACK'), true);
  assert.equal(statements.some((sql) => sql.includes('DELETE FROM products')), false);
  assert.equal(released, true);
});
