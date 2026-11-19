const { authenticate, authorize } = require('../middlewares/authMiddleware');
const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Cho phép khách xem danh sách danh mục.
router.get('/', categoryController.list);
// Chỉ Admin đã đăng nhập được tạo, sửa và xóa danh mục.
router.use(authenticate, authorize('admin'));

router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;