const pool = require('../config/db');

/**
 * Lấy tất cả gói tập đang active.
 * @returns {Array<Object>}
 */
async function getAllActivePlans() {
  const query = `
    SELECT plan_id, name, description, duration_days, price, is_active, created_at, updated_at
    FROM membership_plans
    WHERE is_active = TRUE
    ORDER BY plan_id ASC
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
    SELECT plan_id, name, description, duration_days, price, is_active, created_at, updated_at
    FROM membership_plans
    WHERE plan_id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Tạo gói tập mới.
 * @param {string} name
 * @param {string} description
 * @param {number} duration_days
 * @param {number} price
 * @returns {Object}
 */
async function createPlan(name, description, duration_days, price) {
  const query = `
    INSERT INTO membership_plans (name, description, duration_days, price, is_active)
    VALUES ($1, $2, $3, $4, TRUE)
    RETURNING plan_id, name, description, duration_days, price, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, [name, description, duration_days, price]);
  return result.rows[0];
}

/**
 * Cập nhật một gói tập (dynamic SQL, dùng tham số $1, $2...).
 * @param {number} id
 * @param {Object} fields - các trường cần cập nhật (name, description, duration_days, price, is_active)
 * @returns {Object|null}
 */
async function updatePlan(id, fields) {
  const allowed = ['name', 'description', 'duration_days', 'price', 'is_active'];
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
    WHERE plan_id = $${paramIndex}
    RETURNING plan_id, name, description, duration_days, price, is_active, created_at, updated_at
  `;
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Xóa mềm gói tập (đặt is_active = FALSE).
 * @param {number} id
 * @returns {Object|null}
 */
async function softDeletePlan(id) {
  const query = `
    UPDATE membership_plans
    SET is_active = FALSE
    WHERE plan_id = $1
    RETURNING plan_id, name, is_active
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

module.exports = { getAllActivePlans, getPlanById, createPlan, updatePlan, softDeletePlan };
