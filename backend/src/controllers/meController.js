const meRepository = require('../repositories/meRepository');

/**
 * Lấy user_id của người đang đăng nhập từ JWT.
 * Chỉ chấp nhận giá trị do middleware xác thực gán vào req.user,
 * tuyệt đối không đọc user_id từ query hay params để tránh IDOR.
 * @param {Object} req
 * @returns {number|null}
 */
function getAuthenticatedUserId(req) {
  const userId = req.user?.user_id;
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

/**
 * Lấy hồ sơ cá nhân của member đang đăng nhập.
 * GET /api/me/profile
 */
async function getProfile(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authenticated user' },
      });
    }

    const profile = await meRepository.getProfileByUserId(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
      error: null,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Lấy danh sách gói tập đã đăng ký của member đang đăng nhập.
 * GET /api/me/memberships
 */
async function getMyMemberships(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authenticated user' },
      });
    }

    const memberships = await meRepository.getMembershipsByUserId(userId);

    return res.status(200).json({
      success: true,
      data: memberships,
      error: null,
    });
  } catch (err) {
    console.error('getMyMemberships error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

/**
 * Lấy lịch sử check-in của member đang đăng nhập.
 * GET /api/me/checkins
 */
async function getMyCheckins(req, res) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authenticated user' },
      });
    }

    const checkins = await meRepository.getCheckinsByUserId(userId);

    return res.status(200).json({
      success: true,
      data: checkins,
      error: null,
    });
  } catch (err) {
    console.error('getMyCheckins error:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal Server Error' },
    });
  }
}

module.exports = { getProfile, getMyMemberships, getMyCheckins };
