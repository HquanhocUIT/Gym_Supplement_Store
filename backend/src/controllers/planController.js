const planRepository = require('../repositories/planRepository');

/**
 * Lấy danh sách gói tập đang active (Public).
 * GET /api/plans
 */
async function getAllActivePlans(req, res) {
  try {
    const plans = await planRepository.getAllActivePlans();
    return res.status(200).json({
      success: true,
      data: plans,
      error: null,
    });
  } catch (err) {
    console.error('getAllActivePlans error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Lấy chi tiết một gói tập (Public).
 * GET /api/plans/:id
 */
async function getPlanById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'plan_id phải là số nguyên dương' },
      });
    }

    const plan = await planRepository.getPlanById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy gói tập' },
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
      error: null,
    });
  } catch (err) {
    console.error('getPlanById error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Tạo gói tập mới (Admin).
 * POST /api/plans
 */
async function createPlan(req, res) {
  try {
    const { name, duration_days, price, status } = req.body;

    if (!name || duration_days == null || price == null) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'name, duration_days và price là bắt buộc' },
      });
    }

    const plan = await planRepository.createPlan(name, duration_days, price, status || 'active');

    return res.status(201).json({
      success: true,
      data: plan,
      error: null,
    });
  } catch (err) {
    console.error('createPlan error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Cập nhật gói tập (Admin).
 * PUT /api/plans/:id
 */
async function updatePlan(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'plan_id phải là số nguyên dương' },
      });
    }

    const fields = {};
    if (req.body.name !== undefined) fields.name = req.body.name;
    if (req.body.duration_days !== undefined) fields.duration_days = req.body.duration_days;
    if (req.body.price !== undefined) fields.price = req.body.price;
    if (req.body.status !== undefined) fields.status = req.body.status;

    const plan = await planRepository.updatePlan(id, fields);
    if (!plan) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy gói tập hoặc không có trường nào để cập nhật' },
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
      error: null,
    });
  } catch (err) {
    console.error('updatePlan error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Xóa mềm gói tập (Admin).
 * DELETE /api/plans/:id
 */
async function softDeletePlan(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'plan_id phải là số nguyên dương' },
      });
    }

    const plan = await planRepository.softDeletePlan(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy gói tập' },
      });
    }

    return res.status(200).json({
      success: true,
      data: { plan_id: plan.id, status: plan.status },
      error: null,
    });
  } catch (err) {
    console.error('softDeletePlan error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

module.exports = {
  getAllActivePlans,
  getPlanById,
  createPlan,
  updatePlan,
  softDeletePlan,
};
