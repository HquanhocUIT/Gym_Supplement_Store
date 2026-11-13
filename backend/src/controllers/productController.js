const productService = require('../services/productService');

// Lấy danh sách sản phẩm và gửi kết quả về client.
exports.list = async (req, res, next) => {
  try {
    const data = await productService.listProducts();

    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách variants của sản phẩm theo mã trên URL.
exports.listVariants = async (req, res, next) => {
  try {
    const data = await productService.listVariantsByProductId(
      req.params.productId
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

// Nhận dữ liệu tạo sản phẩm và trả về sản phẩm vừa tạo.
exports.create = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body);

    return res.status(201).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Nhận mã sản phẩm và dữ liệu mới từ request.
exports.update = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(
      req.params.productId,
      req.body
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

// Nhận dữ liệu và tạo variant cho sản phẩm.
exports.createVariant = async (req, res, next) => {
  try {
    const data = await productService.createProductVariant(
      req.params.productId,
      req.body
    );

    return res.status(201).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Nhận ID sản phẩm, ID variant và dữ liệu cần cập nhật.
exports.updateVariant = async (req, res, next) => {
  try {
    const data = await productService.updateProductVariant(
      req.params.productId,
      req.params.variantId,
      req.body
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

// Xóa variant của sản phẩm.
exports.deleteVariant = async (req, res, next) => {
  try {
    const data = await productService.deleteProductVariant(
      req.params.productId,
      req.params.variantId
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

// Xóa sản phẩm theo mã.
exports.remove = async (req, res, next) => {
  try {
    const data = await productService.deleteProduct(req.params.productId);

    return res.status(200).json({
      success: true,
      data,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

// Nhận file ảnh đã được Multer kiểm tra và chuyển cho service upload.
exports.uploadImage = async (req, res, next) => {
  try {
    const data = await productService.uploadProductImage(
      req.params.productId,
      req.file
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