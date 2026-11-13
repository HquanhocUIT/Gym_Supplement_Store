const { randomUUID } = require('node:crypto');
const getSupabaseClient = require('../config/supabase');

// Chỉ dùng phần mở rộng tương ứng với các loại ảnh được cho phép.
const extensionsByType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function uploadProductImage(productId, file) {
  if (!file?.buffer) {
    throw new Error('Thiếu file ảnh để upload.');
  }

  const extension = extensionsByType[file.mimetype];
  if (!extension) {
    throw new Error('Ảnh phải có định dạng JPEG, PNG hoặc WebP.');
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error('Thiếu tên bucket Supabase.');
  }

  // Tạo tên file ngẫu nhiên; không dùng tên file do người gửi cung cấp.
  const filePath = `products/${productId}/${randomUUID()}.${extension}`;
  const storage = getSupabaseClient().storage.from(bucket);

  const { data, error } = await storage.upload(filePath, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  // Tạo URL công khai để lưu vào products.image_url.
  const { data: urlData } = storage.getPublicUrl(data.path);

  return {
    imageUrl: urlData.publicUrl,
    storagePath: data.path,
  };
}

// Xóa ảnh trong bucket bằng URL đã lưu ở products.image_url.
async function deleteProductImage(imageUrl) {
  if (!imageUrl) return;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error('Thiếu tên bucket Supabase.');
  }

  const marker = `/object/public/${bucket}/`;
  const markerIndex = imageUrl.indexOf(marker);

  // Chỉ xóa URL thuộc bucket của project này.
  if (markerIndex === -1) return;

  const storagePath = decodeURIComponent(
    imageUrl.slice(markerIndex + marker.length)
  );
  const storage = getSupabaseClient().storage.from(bucket);
  const { error } = await storage.remove([storagePath]);

  if (error) throw error;
}

module.exports = {
  uploadProductImage,
  deleteProductImage,
};