const { authenticate, authorize } = require('../middlewares/authMiddleware');
const memberRepository = require('../repositories/memberRepository');

/**
 * Lấy danh sách hội viên (Admin/Staff).
 * GET /api/members?search=...&page=1&limit=10
 */
async function getMembers(req, res) {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'page phải là số nguyên >= 1' },
      });
    }

    if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'limit phải là số nguyên từ 1 đến 100' },
      });
    }

    const { rows, total } = await memberRepository.getMembers(search || null, pageNum, limitNum);

    return res.status(200).json({
      success: true,
      data: {
        members: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      error: null,
    });
  } catch (err) {
    console.error('getMembers error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Lấy chi tiết một hội viên (Admin/Staff).
 * GET /api/members/:id
 */
async function getMemberById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'user_id phải là số nguyên dương' },
      });
    }

    const member = await memberRepository.getMemberById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy hội viên' },
      });
    }

    return res.status(200).json({
      success: true,
      data: member,
      error: null,
    });
  } catch (err) {
    console.error('getMemberById error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Tạo gói tập cho hội viên (Admin/Staff).
 * POST /api/members/:id/memberships
 * Body: { plan_id, start_date }
 * Logic: tự động tính end_date = start_date + duration_days
 */
async function createMembership(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'user_id phải là số nguyên dương' },
      });
    }

    const { plan_id, start_date } = req.body;
    if (!plan_id || !start_date) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'plan_id và start_date là bắt buộc' },
      });
    }

    // Lấy duration_days của gói tập
    const durationDays = await memberRepository.getPlanDuration(Number(plan_id));
    if (durationDays == null) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy gói tập' },
      });
    }

    // Tính end_date = start_date + duration_days
    const start = new Date(start_date);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'start_date không hợp lệ' },
      });
    }

    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    const endDate = end.toISOString().split('T')[0]; // YYYY-MM-DD

    const membership = await memberRepository.createMembership(
      userId,
      Number(plan_id),
      start_date,
      endDate,
      'active'
    );

    return res.status(201).json({
      success: true,
      data: membership,
      error: null,
    });
  } catch (err) {
    console.error('createMembership error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

module.exports = { getMembers, getMemberById, createMembership };
