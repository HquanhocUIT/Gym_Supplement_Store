const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.check);
// Kiểm tra kết nối PostgreSQL local hoặc Supabase đang được cấu hình.
router.get('/health/db', healthController.checkDatabase);

module.exports = router;
