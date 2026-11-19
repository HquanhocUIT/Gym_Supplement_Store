const productRepository = require("../repositories/productRepository");
const productImageService = require("./productImageService");

// Tạo lỗi có mã HTTP để errorHandler trả về đúng status.
function createServiceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// Kiểm tra tham số lọc rồi lấy danh sách sản phẩm.
exports.listProducts = async (query = {}) => {
  const rawSearch = query.q;
  const q = typeof rawSearch === 'string' ? rawSearch.trim() : '';

  if (rawSearch !== undefined && typeof rawSearch !== 'string') {
    throw createServiceError(400, 'INVALID_SEARCH', 'Từ khóa tìm kiếm không hợp lệ.');
  }

  if (q.length > 255) {
    throw createServiceError(400, 'INVALID_SEARCH', 'Từ khóa không được quá 255 ký tự.');
  }

  // Nhận category trên URL là ID danh mục.
  let categoryId;
  if (query.category !== undefined && query.category !== '') {
    categoryId = Number(query.category);
    if (!Number.isInteger(categoryId) || categoryId < 1) {
      throw createServiceError(400, 'INVALID_CATEGORY_ID', 'Danh mục không hợp lệ.');
    }
  }

  // Chuyển giá từ query string sang số và không nhận giá âm.
  const parsePrice = (value, fieldName) => {
    if (value === undefined || value === '') return undefined;

    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) {
      throw createServiceError(400, 'INVALID_PRICE', `${fieldName} phải là số không âm.`);
    }

    return price;
  };

  const minPrice = parsePrice(query.minPrice, 'minPrice');
  const maxPrice = parsePrice(query.maxPrice, 'maxPrice');

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw createServiceError(400, 'INVALID_PRICE_RANGE', 'minPrice không được lớn hơn maxPrice.');
  }

  // Chỉ nhận các kiểu sắp xếp mà repository hỗ trợ.
  const allowedSorts = ['newest', 'name_asc', 'name_desc', 'price_asc', 'price_desc'];
  const sort = query.sort || 'newest';
  if (!allowedSorts.includes(sort)) {
    throw createServiceError(400, 'INVALID_SORT', 'Kiểu sắp xếp không hợp lệ.');
  }

  // Trang và giới hạn trang phải là số nguyên dương.
  const parsePositiveInteger = (value, defaultValue, fieldName) => {
    if (value === undefined || value === '') return defaultValue;

    const number = Number(value);
    if (!Number.isInteger(number) || number < 1) {
      throw createServiceError(400, `INVALID_${fieldName.toUpperCase()}`, `${fieldName} phải là số nguyên dương.`);
    }

    return number;
  };

  const page = parsePositiveInteger(query.page, 1, 'page');
  const limit = parsePositiveInteger(query.limit, 12, 'limit');

  if (limit > 100) {
    throw createServiceError(400, 'INVALID_LIMIT', 'limit không được lớn hơn 100.');
  }

  return productRepository.listProducts({
    q,
    categoryId,
    minPrice,
    maxPrice,
    sort,
    page,
    limit,
  });
};

// Lấy chi tiết sản phẩm kèm danh sách variant.
exports.getProductDetail = async (productId) => {
  const numericId = Number(productId);

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw createServiceError(400, 'INVALID_PRODUCT_ID', 'Mã sản phẩm không hợp lệ.');
  }

  const product = await productRepository.getProductDetailById(numericId);
  if (!product) {
    throw createServiceError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
  }

  const variants = await productRepository.listVariantsByProductId(numericId);
  return { ...product, variants };
};

// Lấy variants của sản phẩm sau khi kiểm tra mã sản phẩm.
exports.listVariantsByProductId = (productId) => {
  const numericId = Number(productId);

  if (!Number.isInteger(numericId) || numericId < 1) {
    const error = new Error("Mã sản phẩm không hợp lệ.");
    error.status = 400;
    error.code = "INVALID_PRODUCT_ID";
    throw error;
  }

  return productRepository.listVariantsByProductId(numericId);
};

// Kiểm tra dữ liệu rồi yêu cầu repository tạo sản phẩm.
exports.createProduct = async (input = {}) => {
  const categoryId = Number(input.categoryId);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : null;

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw createServiceError(
      400,
      "INVALID_CATEGORY_ID",
      "Mã danh mục không hợp lệ.",
    );
  }

  if (!name || name.length > 255) {
    throw createServiceError(
      400,
      "INVALID_PRODUCT_NAME",
      "Tên sản phẩm phải có từ 1 đến 255 ký tự.",
    );
  }

  try {
    return await productRepository.createProduct({
      categoryId,
      name,
      description: description || null,
      imageUrl: null,
    });
  } catch (error) {
    if (error.code === "23503") {
      throw createServiceError(
        400,
        "CATEGORY_NOT_FOUND",
        "Danh mục không tồn tại.",
      );
    }

    throw error;
  }
};

// Kiểm tra dữ liệu rồi cập nhật sản phẩm.
exports.updateProduct = async (id, input = {}) => {
  const numericId = Number(id);
  const categoryId = Number(input.categoryId);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : null;

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw createServiceError(
      400,
      "INVALID_PRODUCT_ID",
      "Mã sản phẩm không hợp lệ.",
    );
  }

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw createServiceError(
      400,
      "INVALID_CATEGORY_ID",
      "Mã danh mục không hợp lệ.",
    );
  }

  if (!name || name.length > 255) {
    throw createServiceError(
      400,
      "INVALID_PRODUCT_NAME",
      "Tên sản phẩm phải có từ 1 đến 255 ký tự.",
    );
  }

  try {
    const product = await productRepository.updateProduct(numericId, {
      categoryId,
      name,
      description: description || null,
    });

    if (!product) {
      throw createServiceError(
        404,
        "PRODUCT_NOT_FOUND",
        "Không tìm thấy sản phẩm.",
      );
    }

    return product;
  } catch (error) {
    if (error.code === "23503") {
      throw createServiceError(
        400,
        "CATEGORY_NOT_FOUND",
        "Danh mục không tồn tại.",
      );
    }

    throw error;
  }
};

// Kiểm tra dữ liệu rồi tạo variant cho sản phẩm.
exports.createProductVariant = async (productId, input = {}) => {
  const numericProductId = Number(productId);
  const size = typeof input.size === "string" ? input.size.trim() : "";
  const flavor = typeof input.flavor === "string" ? input.flavor.trim() : null;
  const price =
    input.price === undefined || input.price === null || input.price === ""
      ? NaN
      : Number(input.price);

  const stock =
    input.stock === undefined
      ? 0
      : input.stock === null || input.stock === ""
        ? NaN
        : Number(input.stock);

  if (!Number.isInteger(numericProductId) || numericProductId < 1) {
    throw createServiceError(
      400,
      "INVALID_PRODUCT_ID",
      "Mã sản phẩm không hợp lệ.",
    );
  }

  if (!size || size.length > 100) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_SIZE",
      "Kích cỡ phải có từ 1 đến 100 ký tự.",
    );
  }

  if (flavor && flavor.length > 100) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_FLAVOR",
      "Hương vị không được quá 100 ký tự.",
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_PRICE",
      "Giá phải là số không âm.",
    );
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_STOCK",
      "Tồn kho phải là số nguyên không âm.",
    );
  }

  try {
    return await productRepository.createProductVariant({
      productId: numericProductId,
      flavor: flavor || null,
      size,
      price,
      stock,
    });
  } catch (error) {
    if (error.code === "23503") {
      throw createServiceError(
        404,
        "PRODUCT_NOT_FOUND",
        "Không tìm thấy sản phẩm.",
      );
    }

    throw error;
  }
};

// Kiểm tra dữ liệu rồi cập nhật variant.
exports.updateProductVariant = async (productId, variantId, input = {}) => {
  const numericProductId = Number(productId);
  const numericVariantId = Number(variantId);
  const size = typeof input.size === "string" ? input.size.trim() : "";
  const flavor = typeof input.flavor === "string" ? input.flavor.trim() : null;
  const price =
    input.price === undefined || input.price === null || input.price === ""
      ? NaN
      : Number(input.price);
  const stock =
    input.stock === undefined
      ? 0
      : input.stock === null || input.stock === ""
        ? NaN
        : Number(input.stock);

  if (
    !Number.isInteger(numericProductId) ||
    numericProductId < 1 ||
    !Number.isInteger(numericVariantId) ||
    numericVariantId < 1
  ) {
    throw createServiceError(
      400,
      "INVALID_ID",
      "Mã sản phẩm hoặc variant không hợp lệ.",
    );
  }

  if (!size || size.length > 100) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_SIZE",
      "Kích cỡ phải có từ 1 đến 100 ký tự.",
    );
  }

  if (flavor && flavor.length > 100) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_FLAVOR",
      "Hương vị không được quá 100 ký tự.",
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_PRICE",
      "Giá phải là số không âm.",
    );
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw createServiceError(
      400,
      "INVALID_VARIANT_STOCK",
      "Tồn kho phải là số nguyên không âm.",
    );
  }

  const variant = await productRepository.updateProductVariant(
    numericProductId,
    numericVariantId,
    { flavor: flavor || null, size, price, stock },
  );

  if (!variant) {
    throw createServiceError(
      404,
      "VARIANT_NOT_FOUND",
      "Không tìm thấy variant thuộc sản phẩm này.",
    );
  }

  return variant;
};

// Xóa variant và xử lý trường hợp variant đang được tham chiếu.
exports.deleteProductVariant = async (productId, variantId) => {
  const numericProductId = Number(productId);
  const numericVariantId = Number(variantId);

  if (
    !Number.isInteger(numericProductId) ||
    numericProductId < 1 ||
    !Number.isInteger(numericVariantId) ||
    numericVariantId < 1
  ) {
    throw createServiceError(
      400,
      "INVALID_ID",
      "Mã sản phẩm hoặc variant không hợp lệ.",
    );
  }

  try {
    const variant = await productRepository.deleteProductVariant(
      numericProductId,
      numericVariantId,
    );

    if (!variant) {
      throw createServiceError(
        404,
        "VARIANT_NOT_FOUND",
        "Không tìm thấy variant thuộc sản phẩm này.",
      );
    }

    return variant;
  } catch (error) {
    if (error.code === "23503") {
      throw createServiceError(
        409,
        "VARIANT_IN_USE",
        "Variant đang được dùng trong giỏ hàng hoặc đơn hàng.",
      );
    }

    throw error;
  }
};

// Xóa sản phẩm và báo lỗi nếu sản phẩm còn variant.
exports.deleteProduct = async (id) => {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw createServiceError(
      400,
      "INVALID_PRODUCT_ID",
      "Mã sản phẩm không hợp lệ.",
    );
  }

  try {
    const product = await productRepository.deleteProduct(numericId);

    if (!product) {
      throw createServiceError(
        404,
        "PRODUCT_NOT_FOUND",
        "Không tìm thấy sản phẩm.",
      );
    }
    // Xóa ảnh trong Storage sau khi sản phẩm đã được xóa khỏi database.
    if (product.image_url) {
      try {
        await productImageService.deleteProductImage(product.image_url);
      } catch {
        console.error("Không thể xóa ảnh sản phẩm khỏi Supabase Storage.");
      }
    }

    return product;
  } catch (error) {
    if (error.code === "23503") {
      throw createServiceError(
        409,
        "PRODUCT_HAS_VARIANTS",
        "Hãy xóa các variant trước khi xóa sản phẩm.",
      );
    }

    throw error;
  }
};

// Upload ảnh lên Storage rồi lưu URL vào sản phẩm.
exports.uploadProductImage = async (id, file) => {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw createServiceError(
      400,
      "INVALID_PRODUCT_ID",
      "Mã sản phẩm không hợp lệ.",
    );
  }

  if (!file?.buffer) {
    throw createServiceError(400, "IMAGE_REQUIRED", "Bạn cần chọn file ảnh.");
  }

  const existingProduct = await productRepository.getProductById(numericId);

  if (!existingProduct) {
    throw createServiceError(
      404,
      "PRODUCT_NOT_FOUND",
      "Không tìm thấy sản phẩm.",
    );
  }

  const uploaded = await productImageService.uploadProductImage(
    numericId,
    file,
  );
  // Lưu URL ảnh mới; nếu database lỗi thì xóa file vừa upload.
  let product;

  try {
    product = await productRepository.updateProductImageUrl(
      numericId,
      uploaded.imageUrl,
    );

    if (!product) {
      throw createServiceError(
        404,
        "PRODUCT_NOT_FOUND",
        "Không tìm thấy sản phẩm.",
      );
    }
  } catch (error) {
    try {
      await productImageService.deleteProductImage(uploaded.imageUrl);
    } catch {
      console.error("Không thể dọn ảnh mới khỏi Supabase Storage.");
    }

    throw error;
  }
  // Xóa ảnh cũ sau khi đã lưu URL ảnh mới.
  if (existingProduct.image_url) {
    try {
      await productImageService.deleteProductImage(existingProduct.image_url);
    } catch {
      console.error("Không thể xóa ảnh cũ khỏi Supabase Storage.");
    }
  }

  return product;
};
