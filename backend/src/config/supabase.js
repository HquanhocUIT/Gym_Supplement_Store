const { createClient } = require('@supabase/supabase-js');

let supabaseClient;

// Chỉ tạo client khi cần dùng Storage, để backend vẫn khởi động được khi chưa cấu hình.
function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error('Thiếu cấu hình Supabase trong biến môi trường.');
  }

  // Client dùng Secret key, chỉ được gọi trong backend.
  supabaseClient = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

module.exports = getSupabaseClient;