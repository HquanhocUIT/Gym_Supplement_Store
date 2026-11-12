const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me_in_production';

/**
 * Xác thực Bearer JWT từ header Authorization.
 * Gán req.user = { user_id, role } nếu token hợp lệ.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      data: null,
      error: { code: 'INVALID_TOKEN', message: 'Token expired or invalid' },
    });
  }
}

/**
 * Phân quyền: chỉ cho phép các role trong danh sách được vào.
 * @param {...string} roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'Access denied for this role' },
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
