const pool = require('../config/db');

/**
 * Tìm user theo email.
 * @param {string} email
 * @returns {Object|null}
 */
async function findUserByEmail(email) {
  const query = `
    SELECT id, email, password_hash, full_name, phone, role, is_active
    FROM users
    WHERE email = $1
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

/**
 * Tạo user mới.
 * @param {string} email
 * @param {string} passwordHash - đã băm bằng bcrypt
 * @param {string} fullName
 * @param {string} role - 'admin' | 'staff' | 'member'
 * @returns {Object} Dòng user vừa chèn (bao gồm user_id)
 */
async function createUser(email, passwordHash, fullName, role = 'member') {
  const query = `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role, is_active, created_at
  `;
  const result = await pool.query(query, [email, passwordHash, fullName, role]);
  return result.rows[0];
}

module.exports = { findUserByEmail, createUser };
