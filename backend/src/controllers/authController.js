const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../repositories/authRepository');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function requireJwtSecret(res) {
  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'CONFIGURATION_ERROR', message: 'JWT_SECRET is not configured' },
    });
  }
  return true;
}

/**
 * Đăng ký tài khoản mới (mặc định role = member).
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'email, password and full_name are required' },
      });
    }

    if (!requireJwtSecret(res)) return;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        data: null,
        error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = 'member';

    const user = await createUser(email, passwordHash, full_name, userRole);

    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      data: {
        user: {
          user_id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        access_token: token,
      },
      error: null,
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * Đăng nhập và cấp JWT.
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
      });
    }

    if (!requireJwtSecret(res)) return;

    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      data: {
        user: {
          user_id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        access_token: token,
      },
      error: null,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

module.exports = { register, login };
