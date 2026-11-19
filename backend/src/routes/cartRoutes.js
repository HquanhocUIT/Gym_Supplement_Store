const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả thao tác giỏ hàng cần tài khoản đăng nhập.
router.use(authenticate);

// Xem giỏ, thêm món, cập nhật số lượng và xóa món.
router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.deleteItem);

module.exports = router;
