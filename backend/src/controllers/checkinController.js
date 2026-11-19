const checkinRepository = require('../repositories/checkinRepository');

/**
 * Tạo check-in mới (Admin/Staff).
 * POST /api/checkins
 * Body: { user_id }
 * Logic: Kiểm tra gói tập active trước khi cho check-in.
 */
async function createCheckin(req, res) {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'user_id is required' },
      });
    }

    const userId = Number(user_id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'user_id must be a positive integer' },
      });
    }

    // Kiểm tra gói tập active
    const hasActiveMembership = await checkinRepository.checkActiveMembership(userId);
    if (!hasActiveMembership) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'MEMBERSHIP_EXPIRED',
          message: 'Membership is expired or not registered',
        },
      });
    }

    // Tạo check-in
    const checkin = await checkinRepository.createCheckin(userId);

    return res.status(201).json({
      success: true,
      data: checkin,
      error: null,
    });
  } catch (err) {
    console.error('createCheckin error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Lấy danh sách check-in hôm nay (Admin/Staff).
 * GET /api/checkins/today
 */
async function getTodayCheckins(req, res) {
  try {
    const checkins = await checkinRepository.getTodayCheckins();

    return res.status(200).json({
      success: true,
      data: checkins,
      error: null,
    });
  } catch (err) {
    console.error('getTodayCheckins error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

module.exports = { createCheckin, getTodayCheckins };
