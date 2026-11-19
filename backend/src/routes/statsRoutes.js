const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const statsController = require('../controllers/statsController');

const router = express.Router();

// Chỉ Admin và Staff được đọc dashboard nội bộ.
router.get('/stats', authenticate, authorize('admin', 'staff'), statsController.getAdminStats);

module.exports = router;
