const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Checkout chỉ dành cho tài khoản đã đăng nhập.
router.post('/', authenticate, orderController.createOrder);

module.exports = router;
