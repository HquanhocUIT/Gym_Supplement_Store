const categoryService = require('../services/categoryService');

// Trả danh sách danh mục.
exports.list = async (req, res, next) => {
  try {
    const data = await categoryService.listCategories();

    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Tạo một danh mục mới.
exports.create = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body?.name);

    return res.status(201).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Đổi tên danh mục và trả kết quả về client.
exports.update = async (req, res, next) => {
  try {
    const data = await categoryService.updateCategory(
      req.params.id,
      req.body?.name
    );

    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Xóa danh mục theo mã.
exports.remove = async (req, res, next) => {
  try {
    const data = await categoryService.deleteCategory(req.params.id);

    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};