const pool = require('../config/db');

/**
 * Lấy tất cả gói tập đang active.
 * @returns {Array<Object>}
 */
async function getAllActivePlans() {
  const query = `
    SELECT id, name, duration_days, price, status, created_at, updated_at
    FROM membership_plans
    WHERE status = 'active'
    ORDER BY id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Lấy chi tiết một gói tập theo ID.
 * @param {number} id
 * @returns {Object|null}
 */
async function getPlanById(id) {
  const query = `
    SELECT id, name, duration_days, price, status, created_at, updated_at
    FROM membership_plans
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Tạo gói tập mới.
 * @param {string} name
 * @param {number} duration_days
 * @param {number} price
 * @param {string} status
 * @returns {Object}
 */
async function createPlan(name, duration_days, price, status = 'active') {
  const query = `
    INSERT INTO membership_plans (name, duration_days, price, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, duration_days, price, status, created_at, updated_at
  `;
  const result = await pool.query(query, [name, duration_days, price, status]);
  return result.rows[0];
}

/**
 * Cập nhật một gói tập (dynamic SQL, dùng tham số $1, $2...).
 * @param {number} id
 * @param {Object} fields - các trường cần cập nhật (name, duration_days, price, status)
 * @returns {Object|null}
 */
async function updatePlan(id, fields) {
  const allowed = ['name', 'duration_days', 'price', 'status'];
  const setClauses = [];
  const values = [];

  let paramIndex = 1;
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.includes(key)) continue;
    setClauses.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }

  if (setClauses.length === 0) {
    return null;
  }

  values.push(id);
  const query = `
    UPDATE membership_plans
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, duration_days, price, status, created_at, updated_at
  `;
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Xóa mềm gói tập (đặt status = 'hidden').
 * @param {number} id
 * @returns {Object|null}
 */
async function softDeletePlan(id) {
  const query = `
    UPDATE membership_plans
    SET status = 'hidden'
    WHERE id = $1
    RETURNING id, name, status
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

module.exports = { getAllActivePlans, getPlanById, createPlan, updatePlan, softDeletePlan };
