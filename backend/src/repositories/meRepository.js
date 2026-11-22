const pool = require('../config/db');

/**
 * Lấy hồ sơ của chính người dùng đang đăng nhập.
 * userId luôn lấy từ JWT, không nhận từ query hay params.
 * @param {number} userId
 * @returns {Object|null}
 */
async function getProfileByUserId(userId) {
  const query = `
    SELECT id, email, full_name, role, created_at
    FROM users
    WHERE id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Lấy danh sách gói tập của chính người dùng đang đăng nhập.
 * Điều kiện user_id = $1 đảm bảo không thể đọc dữ liệu của người khác.
 * @param {number} userId
 * @returns {Array<Object>}
 */
async function getMembershipsByUserId(userId) {
  const query = `
    SELECT m.id, m.plan_id, m.start_date, m.end_date, m.status,
           mp.name AS plan_name, mp.duration_days, mp.price
    FROM memberships m
    JOIN membership_plans mp ON mp.id = m.plan_id
    WHERE m.user_id = $1
    ORDER BY m.created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Lấy lịch sử check-in của chính người dùng đang đăng nhập.
 * Điều kiện user_id = $1 đảm bảo không thể đọc dữ liệu của người khác.
 * @param {number} userId
 * @returns {Array<Object>}
 */
async function getCheckinsByUserId(userId) {
  const query = `
    SELECT c.id, c.checkin_time
    FROM checkins c
    WHERE c.user_id = $1
    ORDER BY c.checkin_time DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

module.exports = {
  getProfileByUserId,
  getMembershipsByUserId,
  getCheckinsByUserId,
};
