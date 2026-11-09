const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authRoutes = require('./authRoutes');

router.get('/health', healthController.check);
// Kiểm tra kết nối PostgreSQL local hoặc Supabase đang được cấu hình.
router.get('/health/db', healthController.checkDatabase);
router.use('/auth', authRoutes);

module.exports = router;
