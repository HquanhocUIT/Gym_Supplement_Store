const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const planRoutes = require('./planRoutes');
const memberRoutes = require('./memberRoutes');
const categoryRoutes = require('./categoryRoutes');
const productRoutes = require('./productRoutes');

router.get('/health', healthController.check);
// Kiểm tra kết nối PostgreSQL local hoặc Supabase đang được cấu hình.
router.get('/health/db', healthController.checkDatabase);
router.use('/auth', authRoutes);
router.use('/plans', planRoutes);
router.use('/members', memberRoutes);

// Mount các endpoint danh mục dưới /api/store/categories.
router.use('/store/categories', categoryRoutes);
// Mount API sản phẩm dưới /api/store/products.
router.use('/store/products', productRoutes);

module.exports = router;
