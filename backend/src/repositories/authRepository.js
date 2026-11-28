const pool = require('../config/db');

/**
 * Tìm user theo email.
 * @param {string} email
 * @returns {Object|null}
 */
async function findUserByEmail(email) {
  const query = `
    SELECT id, email, password_hash, full_name, role, google_sub
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

async function findUserById(userId) {
  const result = await pool.query(
    `SELECT id, email, full_name, role FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function findUserByGoogleSub(googleSub) {
  const result = await pool.query(
    `SELECT id, email, full_name, role, google_sub FROM users WHERE google_sub = $1`,
    [googleSub]
  );
  return result.rows[0] || null;
}

async function linkGoogleSubject(userId, googleSub) {
  const result = await pool.query(
    `UPDATE users SET google_sub = $2, updated_at = now()
     WHERE id = $1 AND google_sub IS NULL
     RETURNING id, email, full_name, role, google_sub`,
    [userId, googleSub]
  );
  return result.rows[0] || null;
}

async function createGoogleUser(email, passwordHash, fullName, googleSub) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, role, google_sub)
     VALUES ($1, $2, $3, 'member', $4)
     RETURNING id, email, full_name, role, google_sub`,
    [email, passwordHash, fullName, googleSub]
  );
  return result.rows[0];
}

/**
 * Tạo user mới.
 * @param {string} email
 * @param {string} passwordHash - đã băm bằng bcrypt
 * @param {string} fullName
 * @param {string} role - 'admin' | 'staff' | 'member'
 * @returns {Object} Dòng user vừa chèn (bao gồm id)
 */
async function createUser(email, passwordHash, fullName, role = 'member') {
  const query = `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role, created_at
  `;
  const result = await pool.query(query, [email, passwordHash, fullName, role]);
  return result.rows[0];
}

module.exports = { findUserByEmail, findUserById, findUserByGoogleSub, linkGoogleSubject, createGoogleUser, createUser };
