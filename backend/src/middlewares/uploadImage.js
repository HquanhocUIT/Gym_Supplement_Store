const multer = require('multer');

// Chấp nhận MIME của ảnh JPEG, PNG và WebP.
const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

// Nhận tối đa một file tên image, dung lượng không quá 5 MB.
const receiveImage = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  // Báo lỗi 400 nếu loại file không được hỗ trợ.
  fileFilter(req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
      error.status = 400;
      error.code = 'INVALID_IMAGE_TYPE';
      return callback(error);
    }

    callback(null, true);
  },
}).single('image');

// Chuyển lỗi Multer sang errorHandler chung của ứng dụng.
module.exports = (req, res, next) => {
  receiveImage(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.status = 413;
        error.message = 'Ảnh không được vượt quá 5 MB.';
      } else if (error instanceof multer.MulterError) {
        error.status = 400;
      }

      return next(error);
    }

    next();
  });
};