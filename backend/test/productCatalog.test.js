const assert = require('node:assert/strict');
const { once } = require('node:events');
const { after, before, test } = require('node:test');

// Dùng pool không kết nối database thật trong các bài test API này.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.DATABASE_SSL = 'false';
process.env.DATABASE_SSL_CA_PATH = '';
process.env.PGHOST = '127.0.0.1';
process.env.PGPORT = '1';
process.env.JWT_SECRET = 'test_secret_key';

const app = require('../src/app');
const pool = require('../src/config/db');
const productRepository = require('../src/repositories/productRepository');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await pool.end();
});

// Kiểm tra query được chuyển đổi đúng trước khi vào repository.
test('GET products passes filters and pagination to the repository', async (t) => {
  const expectedData = {
    items: [{ id: 1, name: 'Daily Whey', lowest_price: '790000.00', total_stock: 20 }],
    pagination: { page: 2, limit: 5, total: 6, totalPages: 2 },
  };
  const listProducts = t.mock.method(
    productRepository,
    'listProducts',
    async (filters) => {
      assert.deepEqual(filters, {
        q: 'whey',
        categoryId: 2,
        minPrice: 500000,
        maxPrice: 900000,
        sort: 'price_asc',
        page: 2,
        limit: 5,
      });
      return expectedData;
    },
  );

  const response = await fetch(
    `${baseUrl}/api/store/products?q=whey&category=2&minPrice=500000&maxPrice=900000&sort=price_asc&page=2&limit=5`,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: expectedData,
    error: null,
  });
  assert.equal(listProducts.mock.callCount(), 1);
});

// Từ chối khoảng giá sai và không gọi repository.
test('GET products rejects minPrice greater than maxPrice', async (t) => {
  const listProducts = t.mock.method(
    productRepository,
    'listProducts',
    async () => ({ items: [], pagination: {} }),
  );

  const response = await fetch(
    `${baseUrl}/api/store/products?minPrice=900000&maxPrice=500000`,
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_PRICE_RANGE');
  assert.equal(listProducts.mock.callCount(), 0);
});

// Chi tiết sản phẩm phải đi kèm danh sách variant.
test('GET product detail returns product and variants', async (t) => {
  const product = {
    id: 7,
    name: 'Daily Whey',
    category_id: 1,
    category_name: 'Whey Protein',
  };
  const variants = [{ id: 3, product_id: 7, size: '1 kg', price: '790000.00', stock: 20 }];

  const getProductDetailById = t.mock.method(
    productRepository,
    'getProductDetailById',
    async (id) => {
      assert.equal(id, 7);
      return product;
    },
  );
  const listVariantsByProductId = t.mock.method(
    productRepository,
    'listVariantsByProductId',
    async (id) => {
      assert.equal(id, 7);
      return variants;
    },
  );

  const response = await fetch(`${baseUrl}/api/store/products/7`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { ...product, variants },
    error: null,
  });
  assert.equal(getProductDetailById.mock.callCount(), 1);
  assert.equal(listVariantsByProductId.mock.callCount(), 1);
});

// ID sai phải trả 400 trước khi gọi repository.
test('GET product detail rejects an invalid product ID', async (t) => {
  const getProductDetailById = t.mock.method(
    productRepository,
    'getProductDetailById',
    async () => null,
  );

  const response = await fetch(`${baseUrl}/api/store/products/abc`);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_PRODUCT_ID');
  assert.equal(getProductDetailById.mock.callCount(), 0);
});

// Sản phẩm không tồn tại phải trả 404.
test('GET product detail returns 404 when the product is missing', async (t) => {
  const getProductDetailById = t.mock.method(
    productRepository,
    'getProductDetailById',
    async () => null,
  );
  const listVariantsByProductId = t.mock.method(
    productRepository,
    'listVariantsByProductId',
    async () => [],
  );

  const response = await fetch(`${baseUrl}/api/store/products/99999`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, 'PRODUCT_NOT_FOUND');
  assert.equal(getProductDetailById.mock.callCount(), 1);
  assert.equal(listVariantsByProductId.mock.callCount(), 0);
});
