const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('node:crypto');
const {
  findUserByEmail,
  findUserByGoogleSub,
  linkGoogleSubject,
  createGoogleUser,
  createUser,
} = require('../repositories/authRepository');
const { verifyGoogleIdToken } = require('../services/googleIdentityService');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Định dạng email tối thiểu: có ký tự trước @, tên miền và phần mở rộng.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Chuẩn hóa email: chỉ nhận chuỗi và bỏ khoảng trắng hai đầu.
function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Kiểm tra email có đúng định dạng cơ bản hay không.
function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
}

// Kiểm tra cấu hình; trả false để controller dừng khi thiếu secret.
function requireJwtSecret(res) {
  if (!JWT_SECRET) {
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'JWT_SECRET is not configured',
      },
    });

    return false;
  }

  return true;
}

// Trả lỗi 400 thống nhất cho dữ liệu đầu vào không hợp lệ.
function sendValidationError(res, message) {
  return res.status(400).json({
    success: false,
    data: null,
    error: { code: 'VALIDATION_ERROR', message },
  });
}

/**
 * Đăng ký tài khoản mới (mặc định role = member).
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const fullName = typeof req.body?.full_name === 'string' ? req.body.full_name.trim() : '';

    if (!email || !password || !fullName) {
      return sendValidationError(res, 'email, password and full_name are required');
    }

    if (!isValidEmail(email)) {
      return sendValidationError(res, 'Email không đúng định dạng');
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

    const user = await createUser(email, passwordHash, fullName, userRole);

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
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Đăng nhập và cấp JWT.
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return sendValidationError(res, 'email and password are required');
    }

    if (!isValidEmail(email)) {
      return sendValidationError(res, 'Email không đúng định dạng');
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
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Xác minh Google ID token rồi đăng nhập hoặc liên kết tài khoản member.
 * POST /api/auth/google
 */
async function googleLogin(req, res) {
  const credential = req.body?.credential;
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (typeof credential !== 'string' || credential.length < 100 || credential.length > 8192) {
    return sendValidationError(res, 'A valid Google credential is required');
  }

  if (!googleClientId) {
    return res.status(503).json({
      success: false,
      data: null,
      error: { code: 'GOOGLE_AUTH_NOT_CONFIGURED', message: 'Google sign-in is not configured yet' },
    });
  }

  if (!requireJwtSecret(res)) return;

  let identity;
  try {
    identity = await verifyGoogleIdToken(credential, googleClientId);
  } catch {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'INVALID_GOOGLE_CREDENTIAL', message: 'Google sign-in could not verify this account' },
    });
  }

  try {
    let user = await findUserByGoogleSub(identity.googleSub);

    if (!user) {
      const existing = await findUserByEmail(identity.email);
      if (existing) {
        if (existing.role !== 'member') {
          return res.status(403).json({
            success: false,
            data: null,
            error: { code: 'GOOGLE_SIGN_IN_UNAVAILABLE', message: 'Staff and admin accounts must use password sign-in' },
          });
        }
        if (existing.google_sub && existing.google_sub !== identity.googleSub) {
          return res.status(409).json({
            success: false,
            data: null,
            error: { code: 'GOOGLE_ACCOUNT_CONFLICT', message: 'A different Google account is already linked to this email' },
          });
        }

        user = existing.google_sub
          ? existing
          : await linkGoogleSubject(existing.id, identity.googleSub);

        if (!user) {
          const linked = await findUserByGoogleSub(identity.googleSub);
          if (linked?.id === existing.id) user = linked;
          else {
            return res.status(409).json({
              success: false,
              data: null,
              error: { code: 'GOOGLE_ACCOUNT_CONFLICT', message: 'This Google account is already linked to another account' },
            });
          }
        }
      } else {
        // Password auth vẫn hoạt động; giá trị ngẫu nhiên này không được gửi ra client.
        const passwordHash = await bcrypt.hash(randomBytes(48).toString('base64url'), 10);
        try {
          user = await createGoogleUser(identity.email, passwordHash, identity.fullName, identity.googleSub);
        } catch (error) {
          if (error.code !== '23505') throw error;

          // Hai lần đăng nhập đồng thời có thể cùng tạo một email hoặc Google subject.
          user = await findUserByGoogleSub(identity.googleSub);
          if (!user) {
            const racedAccount = await findUserByEmail(identity.email);
            if (racedAccount?.role === 'member' && !racedAccount.google_sub) {
              user = await linkGoogleSubject(racedAccount.id, identity.googleSub);
            }
          }
          if (!user) {
            return res.status(409).json({
              success: false,
              data: null,
              error: { code: 'GOOGLE_ACCOUNT_CONFLICT', message: 'This email is already connected to another account' },
            });
          }
        }
      }
    }

    if (user.role !== 'member') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'GOOGLE_SIGN_IN_UNAVAILABLE', message: 'Staff and admin accounts must use password sign-in' },
      });
    }

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
    console.error('google login error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

module.exports = { register, login, googleLogin };
