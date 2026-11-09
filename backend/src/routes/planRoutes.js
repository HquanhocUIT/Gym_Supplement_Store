const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  getAllActivePlans,
  getPlanById,
  createPlan,
  updatePlan,
  softDeletePlan,
} = require('../controllers/planController');

const router = express.Router();

// Public: xem danh sách gói tập đang active
router.get('/', getAllActivePlans);

// Public: xem chi tiết một gói tập
router.get('/:id', getPlanById);

// Admin only: tạo gói tập mới
router.post('/', authenticate, authorize('admin'), createPlan);

// Admin only: cập nhật gói tập
router.put('/:id', authenticate, authorize('admin'), updatePlan);

// Admin only: xóa mềm gói tập
router.delete('/:id', authenticate, authorize('admin'), softDeletePlan);

module.exports = router;
