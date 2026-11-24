import { useState } from 'react';
import { ImageOff } from 'lucide-react';

// Ảnh thật được lấy từ URL lưu trong sản phẩm; ảnh thiếu hoặc lỗi có thông báo rõ ràng.
export default function ProductPhoto({ product, className = 'aspect-[4/3] rounded-2xl', loading = 'lazy' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return <div className={`overflow-hidden bg-paper ${className}`}>
    {product.image_url && failedUrl !== product.image_url
      ? <img className="h-full w-full object-contain" src={product.image_url} alt={product.name} loading={loading} onError={() => setFailedUrl(product.image_url)} />
      : <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-brand-50 px-4 text-center text-brand-700" role="img" aria-label={`Photo unavailable for ${product.name}`}><ImageOff size={32} strokeWidth={1.5} aria-hidden="true" /><span className="text-sm font-medium">No photo yet</span></div>}
  </div>;
}
