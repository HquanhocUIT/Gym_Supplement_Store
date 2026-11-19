const pool = require('../config/db');

// Lấy danh sách sản phẩm theo bộ lọc và phân trang.
exports.listProducts = async ({
  q,
  categoryId,
  minPrice,
  maxPrice,
  sort = 'newest',
  page = 1,
  limit = 12,
} = {}) => {
  const conditions = [];
  const values = [];

  // Tìm từ khóa trong tên hoặc mô tả sản phẩm.
  if (q) {
    values.push(`%${q}%`);
    const searchPosition = values.length;
    conditions.push(
      `(p.name ILIKE $${searchPosition}
        OR COALESCE(p.description, '') ILIKE $${searchPosition})`,
    );
  }

  // Lọc theo ID danh mục.
  if (categoryId !== undefined && categoryId !== null) {
    values.push(categoryId);
    conditions.push(`p.category_id = $${values.length}`);
  }

  // Nếu lọc giá, hai điều kiện phải cùng đúng trên một variant.
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceConditions = ['v.product_id = p.id'];

    if (minPrice !== undefined) {
      values.push(minPrice);
      priceConditions.push(`v.price >= $${values.length}`);
    }

    if (maxPrice !== undefined) {
      values.push(maxPrice);
      priceConditions.push(`v.price <= $${values.length}`);
    }

    conditions.push(`
      EXISTS (
        SELECT 1
        FROM product_variants AS v
        WHERE ${priceConditions.join(' AND ')}
      )
    `);
  }

  const whereSql = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Chỉ cho phép các kiểu sắp xếp định trước.
  const sortOptions = {
    newest: 'p.created_at DESC',
    name_asc: 'p.name ASC',
    name_desc: 'p.name DESC',
    price_asc: 'price_summary.lowest_price ASC NULLS LAST',
    price_desc: 'price_summary.lowest_price DESC NULLS LAST',
  };
  const orderBy = sortOptions[sort] || sortOptions.newest;

  // Đếm số sản phẩm thỏa bộ lọc để tính tổng số trang.
  const countResult = await pool.query({
    text: `
      SELECT COUNT(*)::int AS total
      FROM products AS p
      JOIN categories AS c ON c.id = p.category_id
      ${whereSql}
    `,
    values,
    query_timeout: 5000,
  });

  // Tính vị trí bắt đầu của trang đang được yêu cầu.
  const offset = (page - 1) * limit;
  const limitPosition = values.length + 1;
  const offsetPosition = values.length + 2;

  // Trả giá thấp nhất và tổng tồn kho để giao diện có thể hiển thị.
  const productResult = await pool.query({
    text: `
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.category_id,
        c.name AS category_name,
        price_summary.lowest_price,
        COALESCE(price_summary.total_stock, 0)::int AS total_stock,
        p.created_at,
        p.updated_at
      FROM products AS p
      JOIN categories AS c ON c.id = p.category_id
      LEFT JOIN (
        SELECT
          product_id,
          MIN(price) AS lowest_price,
          SUM(stock) AS total_stock
        FROM product_variants
        GROUP BY product_id
      ) AS price_summary ON price_summary.product_id = p.id
      ${whereSql}
      ORDER BY ${orderBy}, p.id ASC
      LIMIT $${limitPosition}
      OFFSET $${offsetPosition}
    `,
    values: [...values, limit, offset],
    query_timeout: 5000,
  });

  const total = Number(countResult.rows[0].total);

  return {
    items: productResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Lấy thông tin sản phẩm và tên danh mục theo ID.
exports.getProductDetailById = async (id) => {
  const result = await pool.query({
    text: `
      SELECT
        p.id,
        p.name,
        p.description,
        p.image_url,
        p.category_id,
        c.name AS category_name,
        p.created_at,
        p.updated_at
      FROM products AS p
      JOIN categories AS c ON c.id = p.category_id
      WHERE p.id = $1
    `,
    values: [id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};

// Lấy các phiên bản của một sản phẩm.
exports.listVariantsByProductId = async (productId) => {
  const result = await pool.query({
    text: `
      SELECT
        id,
        product_id,
        flavor,
        size,
        price,
        stock,
        created_at,
        updated_at
      FROM product_variants
      WHERE product_id = $1
      ORDER BY id
    `,
    values: [productId],
    query_timeout: 5000,
  });

  return result.rows;
};

// Tạo sản phẩm mới trong database.
exports.createProduct = async ({
  categoryId,
  name,
  description,
  imageUrl,
}) => {
  const result = await pool.query({
    text: `
      INSERT INTO products (category_id, name, description, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, category_id, name, description, image_url, created_at, updated_at
    `,
    values: [categoryId, name, description || null, imageUrl || null],
    query_timeout: 5000,
  });

  return result.rows[0];
};

// Cập nhật thông tin cơ bản của sản phẩm.
exports.updateProduct = async (
  id,
  { categoryId, name, description }
) => {
  const result = await pool.query({
    text: `
      UPDATE products
      SET
        category_id = $1,
        name = $2,
        description = $3,
        updated_at = now()
      WHERE id = $4
      RETURNING id, category_id, name, description, image_url, created_at, updated_at
    `,
    values: [categoryId, name, description || null, id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};

// Tạo một variant cho sản phẩm.
exports.createProductVariant = async ({
  productId,
  flavor,
  size,
  price,
  stock,
}) => {
  const result = await pool.query({
    text: `
      INSERT INTO product_variants (product_id, flavor, size, price, stock)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, product_id, flavor, size, price, stock, created_at, updated_at
    `,
    values: [productId, flavor || null, size, price, stock],
    query_timeout: 5000,
  });

  return result.rows[0];
};

// Cập nhật variant thuộc đúng sản phẩm.
exports.updateProductVariant = async (
  productId,
  variantId,
  { flavor, size, price, stock }
) => {
  const result = await pool.query({
    text: `
      UPDATE product_variants
      SET
        flavor = $1,
        size = $2,
        price = $3,
        stock = $4,
        updated_at = now()
      WHERE id = $5 AND product_id = $6
      RETURNING id, product_id, flavor, size, price, stock, created_at, updated_at
    `,
    values: [flavor || null, size, price, stock, variantId, productId],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};
// Xóa variant nếu nó thuộc đúng sản phẩm.
exports.deleteProductVariant = async (productId, variantId) => {
  const result = await pool.query({
    text: `
      DELETE FROM product_variants
      WHERE id = $1 AND product_id = $2
      RETURNING id, product_id, flavor, size, price, stock
    `,
    values: [variantId, productId],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};
// Xóa sản phẩm; database sẽ chặn nếu sản phẩm còn variant.
exports.deleteProduct = async (id) => {
  const result = await pool.query({
    text: `
      DELETE FROM products
      WHERE id = $1
      RETURNING id, category_id, name, description, image_url
    `,
    values: [id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};

// Lưu URL ảnh mới vào sản phẩm.
exports.updateProductImageUrl = async (id, imageUrl) => {
  const result = await pool.query({
    text: `
      UPDATE products
      SET image_url = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, category_id, name, description, image_url, created_at, updated_at
    `,
    values: [imageUrl, id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};

// Tìm sản phẩm theo mã để kiểm tra trước khi upload ảnh.
exports.getProductById = async (id) => {
  const result = await pool.query({
    text: `
      SELECT id, name, image_url
      FROM products
      WHERE id = $1
    `,
    values: [id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};
