const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { createCheckin, getTodayCheckins } = require('../controllers/checkinController');

const router = express.Router();

// Admin/Staff: tạo check-in
router.post('/', authenticate, authorize('admin', 'staff'), createCheckin);

// Admin/Staff: xem danh sách check-in hôm nay
router.get('/today', authenticate, authorize('admin', 'staff'), getTodayCheckins);

module.exports = router;
