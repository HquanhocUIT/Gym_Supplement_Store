const planRepository = require('../repositories/planRepository');

// Chỉ hai trạng thái hợp lệ theo ràng buộc của bảng membership_plans.
const PLAN_STATUSES = ['active', 'hidden'];

// Trả lỗi 400 thống nhất cho dữ liệu đầu vào không hợp lệ.
function sendValidationError(res, message) {
  return res.status(400).json({
    success: false,
    data: null,
    error: { code: 'VALIDATION_ERROR', message },
  });
}

// Chỉ nhận số hoặc chuỗi số; tránh ép kiểu từ null, boolean hay mảng.
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

// Thời hạn phải là số nguyên dương.
function parseDurationDays(value) {
  const duration = toNumber(value);
  return Number.isInteger(duration) && duration > 0 ? duration : null;
}

// Giá gói tập phải lớn hơn 0.
function parsePrice(value) {
  const price = toNumber(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

// Tên gói tập không được rỗng sau khi bỏ khoảng trắng.
function normalizeName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidStatus(value) {
  return PLAN_STATUSES.includes(value);
}

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
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
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
      return sendValidationError(res, 'plan_id phải là số nguyên dương');
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
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Tạo gói tập mới (Admin).
 * POST /api/plans
 */
async function createPlan(req, res) {
  try {
    const name = normalizeName(req.body?.name);
    const durationDays = parseDurationDays(req.body?.duration_days);
    const price = parsePrice(req.body?.price);
    const status = req.body?.status === undefined ? 'active' : req.body.status;

    if (!name || durationDays === null || price === null) {
      return sendValidationError(
        res,
        'name, duration_days (> 0) và price (> 0) là bắt buộc'
      );
    }

    if (!isValidStatus(status)) {
      return sendValidationError(res, 'status phải là active hoặc hidden');
    }

    const plan = await planRepository.createPlan(name, durationDays, price, status);

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
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
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
      return sendValidationError(res, 'plan_id phải là số nguyên dương');
    }

    const fields = {};

    if (req.body?.name !== undefined) {
      const name = normalizeName(req.body.name);
      if (!name) {
        return sendValidationError(res, 'name không được rỗng');
      }
      fields.name = name;
    }

    if (req.body?.duration_days !== undefined) {
      const durationDays = parseDurationDays(req.body.duration_days);
      if (durationDays === null) {
        return sendValidationError(res, 'duration_days phải là số nguyên dương');
      }
      fields.duration_days = durationDays;
    }

    if (req.body?.price !== undefined) {
      const price = parsePrice(req.body.price);
      if (price === null) {
        return sendValidationError(res, 'price phải lớn hơn 0');
      }
      fields.price = price;
    }

    if (req.body?.status !== undefined) {
      if (!isValidStatus(req.body.status)) {
        return sendValidationError(res, 'status phải là active hoặc hidden');
      }
      fields.status = req.body.status;
    }

    if (Object.keys(fields).length === 0) {
      return sendValidationError(res, 'Không có trường nào để cập nhật');
    }

    const plan = await planRepository.updatePlan(id, fields);
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
    console.error('updatePlan error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
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
      return sendValidationError(res, 'plan_id phải là số nguyên dương');
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
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
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
