const pool = require('../config/db');

// Lấy danh sách danh mục.
exports.listCategories = async () => {
  const result = await pool.query({
    text: `
      SELECT id, name, created_at, updated_at
      FROM categories
      ORDER BY name
    `,
    query_timeout: 5000,
  });

  return result.rows;
};

// Tạo danh mục mới.
exports.createCategory = async (name) => {
  const result = await pool.query({
    text: `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING id, name, created_at, updated_at
    `,
    values: [name],
    query_timeout: 5000,
  });

  return result.rows[0];
};

// Đổi tên danh mục.
exports.updateCategory = async (id, name) => {
  const result = await pool.query({
    text: `
      UPDATE categories
      SET name = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, name, created_at, updated_at
    `,
    values: [name, id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};

// Xóa danh mục nếu không còn sản phẩm thuộc danh mục đó.
exports.deleteCategory = async (id) => {
  const result = await pool.query({
    text: `
      DELETE FROM categories
      WHERE id = $1
      RETURNING id, name
    `,
    values: [id],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
};