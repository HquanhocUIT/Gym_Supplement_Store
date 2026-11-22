// Chỉ cho phép ghi các mã lỗi kết nối đã biết, không ghi message, stack hoặc URL.
const knownCodes = new Set([
  '28P01', '28000', '3D000', '53300', '57P03',
  'ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH',
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
  'SELF_SIGNED_CERT_IN_CHAIN', 'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_HAS_EXPIRED',
]);

// Một số driver bọc lỗi gốc trong cause hoặc errors (AggregateError).
function getDatabaseErrorCode(error) {
  const candidates = [error, error?.cause, ...(Array.isArray(error?.errors) ? error.errors : [])];
  for (const candidate of candidates) {
    if (knownCodes.has(candidate?.code)) return candidate.code;
  }

  // pg có thể báo timeout hoặc pooler tenant bằng message mà không có code riêng.
  // Chỉ nhận diện để trả nhãn cố định; không đưa message thật vào log.
  if (candidates.some((candidate) => typeof candidate?.message === 'string' && /timeout|timed out/i.test(candidate.message))) {
    return 'CONNECTION_TIMEOUT';
  }
  if (candidates.some((candidate) => typeof candidate?.message === 'string' && /tenant or user not found/i.test(candidate.message))) {
    return 'POOLER_TENANT_NOT_FOUND';
  }

  return 'UNKNOWN_DATABASE_ERROR';
}

module.exports = { getDatabaseErrorCode };
