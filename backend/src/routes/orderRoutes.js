const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Mọi truy vấn đọc đơn đều được ràng buộc với user_id trong token.
router.get('/', authenticate, orderController.listOwnOrders);
router.get('/:orderId', authenticate, orderController.getOwnOrder);

// Checkout chỉ dành cho tài khoản đã đăng nhập.
router.post('/', authenticate, orderController.createOrder);

module.exports = router;
