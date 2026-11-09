const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  getMembers,
  getMemberById,
  createMembership,
} = require('../controllers/memberController');

const router = express.Router();

// Admin/Staff: danh sách hội viên
router.get('/', authenticate, authorize('admin', 'staff'), getMembers);

// Admin/Staff: chi tiết một hội viên
router.get('/:id', authenticate, authorize('admin', 'staff'), getMemberById);

// Admin/Staff: tạo gói tập cho hội viên
router.post('/:id/memberships', authenticate, authorize('admin', 'staff'), createMembership);

module.exports = router;
