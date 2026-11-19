const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const planRoutes = require('./planRoutes');
const memberRoutes = require('./memberRoutes');
const checkinRoutes = require('./checkinRoutes');
const meRoutes = require('./meRoutes');

router.get('/health', healthController.check);
// Kiểm tra kết nối PostgreSQL local hoặc Supabase đang được cấu hình.
router.get('/health/db', healthController.checkDatabase);
router.use('/auth', authRoutes);
router.use('/plans', planRoutes);
router.use('/members', memberRoutes);
router.use('/checkins', checkinRoutes);
router.use('/me', meRoutes);

module.exports = router;
