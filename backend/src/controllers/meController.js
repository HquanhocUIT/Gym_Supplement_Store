const pool = require('../config/db');

/**
 * Lấy hồ sơ cá nhân của member đang đăng nhập.
 * GET /api/me/profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT id, email, full_name, role, created_at
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      error: null,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Lấy danh sách gói tập đã đăng ký của member đang đăng nhập.
 * GET /api/me/memberships
 */
async function getMyMemberships(req, res) {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT m.id, m.plan_id, m.start_date, m.end_date, m.status,
             mp.name AS plan_name, mp.duration_days, mp.price
      FROM memberships m
      JOIN membership_plans mp ON mp.id = m.plan_id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      data: result.rows,
      error: null,
    });
  } catch (err) {
    console.error('getMyMemberships error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Lấy lịch sử check-in của member đang đăng nhập.
 * GET /api/me/checkins
 */
async function getMyCheckins(req, res) {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT c.id, c.checkin_time
      FROM checkins c
      WHERE c.user_id = $1
      ORDER BY c.checkin_time DESC
    `;
    const result = await pool.query(query, [userId]);

    return res.status(200).json({
      success: true,
      data: result.rows,
      error: null,
    });
  } catch (err) {
    console.error('getMyCheckins error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

module.exports = { getProfile, getMyMemberships, getMyCheckins };
