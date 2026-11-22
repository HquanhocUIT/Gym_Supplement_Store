const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const planRoutes = require('./planRoutes');
const memberRoutes = require('./memberRoutes');
const checkinRoutes = require('./checkinRoutes');
const meRoutes = require('./meRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const statsRoutes = require('./statsRoutes');

router.get('/health', healthController.check);
// Kiểm tra kết nối PostgreSQL local hoặc Supabase đang được cấu hình.
router.get('/health/db', healthController.checkDatabase);
router.use('/auth', authRoutes);
router.use('/plans', planRoutes);
router.use('/members', memberRoutes);
router.use('/checkins', checkinRoutes);
router.use('/me', meRoutes);

// Mount các endpoint danh mục dưới /api/store/categories.
router.use('/store/categories', categoryRoutes);
// Mount API sản phẩm dưới /api/store/products.
router.use('/store/products', productRoutes);
// Mount API giỏ hàng dưới /api/store/cart; từng route tự yêu cầu đăng nhập.
router.use('/store/cart', cartRoutes);
// Mount checkout COD dưới /api/store/orders.
router.use('/store/orders', orderRoutes);
// Mount API thống kê nội bộ dưới /api/admin/stats.
router.use('/admin', statsRoutes);

module.exports = router;
