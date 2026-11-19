const pool = require('../config/db');

/**
 * Kiểm tra xem user có gói tập đang active và chưa hết hạn hay không.
 * @param {number} userId
 * @returns {boolean} true nếu có gói active, false nếu không.
 */
async function checkActiveMembership(userId) {
  const query = `
    SELECT id
    FROM memberships
    WHERE user_id = $1
      AND status = 'active'
      AND end_date >= CURRENT_DATE
    ORDER BY end_date DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows.length > 0;
}

/**
 * Tạo bản ghi check-in mới.
 * @param {number} userId
 * @returns {Object}
 */
async function createCheckin(userId) {
  const query = `
    INSERT INTO checkins (user_id, checkin_time)
    VALUES ($1, NOW())
    RETURNING id, user_id, checkin_time, created_at, updated_at
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Lấy danh sách check-in hôm nay.
 * @returns {Array<Object>}
 */
async function getTodayCheckins() {
  const query = `
    SELECT c.id, c.checkin_time, u.full_name, u.email
    FROM checkins c
    JOIN users u ON c.user_id = u.id
    WHERE c.checkin_time::date = CURRENT_DATE
    ORDER BY c.checkin_time DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

module.exports = { checkActiveMembership, createCheckin, getTodayCheckins };
