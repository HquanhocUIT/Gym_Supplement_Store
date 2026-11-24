import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import ImageUploader from './ImageUploader';
import ProductPhoto from './ProductPhoto';

// Bổ sung hoặc thay ảnh cho sản phẩm đã có mà không tạo lại sản phẩm hay variant.
export default function ProductPhotoEditor({ product }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function savePhoto() {
    if (!file || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const body = new FormData();
      body.append('image', file);
      await apiClient.post(`/store/products/${product.id}/image`, body);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['store-products'] }),
        queryClient.invalidateQueries({ queryKey: ['store-product-detail'] }),
      ]);
      setFile(null);
      setMessage('Photo saved. It is now used in the shop.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return <section className="mb-6 rounded-xl border border-line bg-white p-4" aria-label={`Photo for ${product.name}`}>
    <h2 className="mb-4 font-bold">Product photo</h2>
    <div className="grid min-w-0 gap-5 md:grid-cols-[160px_1fr]">
      <ProductPhoto product={product} className="aspect-square w-full max-w-40 rounded-xl" />
      <div className="min-w-0 space-y-3">
        <ImageUploader label="Choose a new photo" value={file} onChange={(value) => { setFile(value); setMessage(''); setError(''); }} disabled={saving} />
        <button type="button" className="min-h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:opacity-50" disabled={!file || saving} onClick={savePhoto}>{saving ? 'Uploading…' : product.image_url ? 'Replace photo' : 'Upload photo'}</button>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {message && <p className="text-sm text-brand-700" role="status">{message}</p>}
      </div>
    </div>
  </section>;
}
