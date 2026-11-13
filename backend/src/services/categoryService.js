const categoryRepository = require('../repositories/categoryRepository');

// Tạo lỗi có mã HTTP để errorHandler trả đúng status.
function createServiceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// Lấy danh sách danh mục.
exports.listCategories = () => categoryRepository.listCategories();

// Kiểm tra tên rồi tạo danh mục.
exports.createCategory = async (name) => {
  const cleanName = typeof name === 'string' ? name.trim() : '';

  if (!cleanName || cleanName.length > 255) {
    throw createServiceError(
      400,
      'INVALID_CATEGORY_NAME',
      'Tên danh mục phải có từ 1 đến 255 ký tự.'
    );
  }

  try {
    return await categoryRepository.createCategory(cleanName);
  } catch (error) {
    // PostgreSQL báo 23505 khi tên bị trùng vì cột name có UNIQUE.
    if (error.code === '23505') {
      throw createServiceError(
        409,
        'CATEGORY_ALREADY_EXISTS',
        'Danh mục này đã tồn tại.'
      );
    }

    throw error;
  }
};

// Kiểm tra dữ liệu rồi đổi tên danh mục.
exports.updateCategory = async (id, name) => {
  const numericId = Number(id);
  const cleanName = typeof name === 'string' ? name.trim() : '';

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw createServiceError(400, 'INVALID_CATEGORY_ID', 'Mã danh mục không hợp lệ.');
  }

  if (!cleanName || cleanName.length > 255) {
    throw createServiceError(400, 'INVALID_CATEGORY_NAME', 'Tên danh mục phải có từ 1 đến 255 ký tự.');
  }

  try {
    const category = await categoryRepository.updateCategory(numericId, cleanName);

    if (!category) {
      throw createServiceError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
    }

    return category;
  } catch (error) {
    if (error.code === '23505') {
      throw createServiceError(409, 'CATEGORY_ALREADY_EXISTS', 'Danh mục này đã tồn tại.');
    }

    throw error;
  }
};

// Xóa danh mục và xử lý trường hợp danh mục còn sản phẩm.
exports.deleteCategory = async (id) => {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw createServiceError(400, 'INVALID_CATEGORY_ID', 'Mã danh mục không hợp lệ.');
  }

  try {
    const category = await categoryRepository.deleteCategory(numericId);

    if (!category) {
      throw createServiceError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục.');
    }

    return category;
  } catch (error) {
    if (error.code === '23503') {
      throw createServiceError(409, 'CATEGORY_HAS_PRODUCTS', 'Không thể xóa danh mục đang có sản phẩm.');
    }

    throw error;
  }
};