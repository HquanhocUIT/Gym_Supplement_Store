const pool = require('../config/db');

/**
 * Lấy danh sách hội viên (role='member'), kèm thông tin gói tập mới nhất.
 * Hỗ trợ tìm kiếm theo tên/email (ILIKE) và phân trang OFFSET/LIMIT.
 * @param {string|null} search
 * @param {number} page
 * @param {number} limit
 * @returns {Object} { rows, total }
 */
async function getMembers(search, page, limit) {
  const offset = (page - 1) * limit;

  // Truy vấn chính: lấy user + gói tập mới nhất (theo end_date DESC)
  const query = `
    WITH latest_membership AS (
      SELECT DISTINCT ON (m.user_id) m.user_id, m.membership_id, m.plan_id,
             m.start_date, m.end_date, m.status,
             mp.name AS plan_name, mp.duration_days
      FROM memberships m
      JOIN membership_plans mp ON mp.plan_id = m.plan_id
      ORDER BY m.user_id ASC, m.end_date DESC, m.created_at DESC
    )
    SELECT u.user_id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at,
           lm.membership_id, lm.plan_id, lm.start_date, lm.end_date, lm.status,
           lm.plan_name, lm.duration_days
    FROM users u
    LEFT JOIN latest_membership lm ON lm.user_id = u.user_id
    WHERE u.role = 'member'
  `;

  const values = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    values.push(`%${search}%`);
    paramIndex += 1;
  }

  query += ` ORDER BY u.user_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const dataResult = await pool.query(query, values);

  // Truy vấn tổng số bản ghi (dùng cho phân trang)
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM users u
    WHERE u.role = 'member'
  `;
  const countValues = [];
  let countParam = 1;
  if (search) {
    countQuery += ` AND (u.full_name ILIKE $${countParam} OR u.email ILIKE $${countParam})`;
    countValues.push(`%${search}%`);
    countParam += 1;
  }

  const countResult = await pool.query(countQuery, countValues);
  const total = Number(countResult.rows[0].total);

  return { rows: dataResult.rows, total };
}

/**
 * Lấy chi tiết một hội viên và toàn bộ lịch sử đăng ký gói tập.
 * @param {number} id
 * @returns {Object|null}
 */
async function getMemberById(id) {
  const userQuery = `
    SELECT user_id, email, full_name, phone, role, is_active, created_at
    FROM users
    WHERE user_id = $1 AND role = 'member'
  `;
  const userResult = await pool.query(userQuery, [id]);
  if (userResult.rows.length === 0) {
    return null;
  }

  const membershipsQuery = `
    SELECT m.membership_id, m.plan_id, m.start_date, m.end_date, m.status,
           mp.name AS plan_name, mp.duration_days, mp.price
    FROM memberships m
    JOIN membership_plans mp ON mp.plan_id = m.plan_id
    WHERE m.user_id = $1
    ORDER BY m.created_at DESC
  `;
  const membershipsResult = await pool.query(membershipsQuery, [id]);

  return {
    ...userResult.rows[0],
    memberships: membershipsResult.rows,
  };
}

/**
 * Lấy số ngày hoạt động của một gói tập.
 * @param {number} planId
 * @returns {number|null}
 */
async function getPlanDuration(planId) {
  const query = `
    SELECT duration_days
    FROM membership_plans
    WHERE plan_id = $1
  `;
  const result = await pool.query(query, [planId]);
  return result.rows[0] ? result.rows[0].duration_days : null;
}

/**
 * Tạo bản ghi membership mới.
 * @param {number} userId
 * @param {number} planId
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} status
 * @returns {Object}
 */
async function createMembership(userId, planId, startDate, endDate, status) {
  const query = `
    INSERT INTO memberships (user_id, plan_id, start_date, end_date, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING membership_id, user_id, plan_id, start_date, end_date, status, created_at, updated_at
  `;
  const result = await pool.query(query, [userId, planId, startDate, endDate, status]);
  return result.rows[0];
}

module.exports = { getMembers, getMemberById, getPlanDuration, createMembership };
