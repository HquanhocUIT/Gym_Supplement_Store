const express = require('express');
const { register, login, refreshSession, googleLogin } = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

// Sync the signed-in account with its current database role.
router.post('/refresh', authenticate, refreshSession);

module.exports = router;
