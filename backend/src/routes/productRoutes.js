const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const uploadImage = require('../middlewares/uploadImage');

const router = express.Router();

// Khách có thể xem danh sách sản phẩm và các variant.
router.get('/', productController.list);
router.get('/:productId/variants', productController.listVariants);

// Các route bên dưới chỉ dành cho Admin đã đăng nhập.
router.use(authenticate, authorize('admin'));

// Tạo, sửa và xóa sản phẩm.
router.post('/', productController.create);
router.put('/:productId', productController.update);
router.delete('/:productId', productController.remove);

// Quản lý variant thuộc đúng sản phẩm trên URL.
router.post('/:productId/variants', productController.createVariant);
router.put('/:productId/variants/:variantId', productController.updateVariant);
router.delete('/:productId/variants/:variantId', productController.deleteVariant);

// Kiểm tra quyền Admin trước khi nhận file ảnh qua Multer.
router.post('/:productId/image', uploadImage, productController.uploadImage);

module.exports = router;