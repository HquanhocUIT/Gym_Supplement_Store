const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  getProfile,
  getMyMemberships,
  getMyCheckins,
} = require('../controllers/meController');

const router = express.Router();

// Member: hồ sơ cá nhân
router.get('/profile', authenticate, getProfile);

// Member: danh sách gói tập của mình
router.get('/memberships', authenticate, getMyMemberships);

// Member: lịch sử check-in của mình
router.get('/checkins', authenticate, getMyCheckins);

module.exports = router;
