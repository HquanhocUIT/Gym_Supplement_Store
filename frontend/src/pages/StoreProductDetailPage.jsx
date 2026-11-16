import { useState } from 'react'
import { ArrowLeft, Check, CircleAlert, Minus, Package, Plus, ShoppingBag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Skeleton } from '../components/common/index.js'
import { Eyebrow } from '../components/Brand.jsx'
import useApiQuery from '../hooks/useApiQuery.js'

const inputClass = 'min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50'

// Hiển thị tiền theo định dạng VND.
function formatPrice(value) {
  if (value === null || value === undefined) return 'Chưa có giá'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

// Nếu sản phẩm chưa có ảnh, hiển thị biểu tượng thay cho ảnh bị lỗi.
function ProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!product.image_url || imageFailed) {
    return (
      <div className="grid aspect-square place-items-center rounded-card bg-brand-50 text-brand-700 sm:rounded-[1.75rem]" role="img" aria-label="Sản phẩm chưa có ảnh">
        <Package size={64} strokeWidth={1.25} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      className="aspect-square w-full rounded-card bg-paper object-cover sm:rounded-[1.75rem]"
      src={product.image_url}
      alt={product.name}
      onError={() => setImageFailed(true)}
    />
  )
}

// Thông tin mua hàng và phiên bản được tách riêng để trạng thái bắt đầu lại khi đổi sản phẩm.
function ProductDetailContent({ product }) {
  const [selectedVariantId, setSelectedVariantId] = useState(() => String(product.variants?.[0]?.id || ''))
  const [quantity, setQuantity] = useState(1)
  const [cartMessage, setCartMessage] = useState('')
  const variants = product?.variants || []
  const selectedVariant = variants.find((variant) => String(variant.id) === selectedVariantId) || variants[0]

  // Giới hạn số lượng chọn không vượt quá tồn kho của phiên bản đang xem.
  function updateQuantity(nextQuantity) {
    const maximum = Number(selectedVariant?.stock || 0)
    setQuantity(Math.min(Math.max(1, nextQuantity), Math.max(1, maximum)))
    setCartMessage('')
  }

  // Backend giỏ hàng thuộc task tiếp theo; thông báo rõ để không giả vờ đã lưu món hàng.
  function handleAddToCart() {
    setCartMessage('Giỏ hàng hiện chưa khả dụng. Bạn có thể xem sản phẩm và chọn phiên bản trước.')
  }

  return (
    // Chi tiết, ảnh, lựa chọn phiên bản và thông tin mua hàng.
    <main className="mt-6 grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
      <div className="rounded-card border border-line bg-white p-3 shadow-card sm:p-5">
        <ProductImage product={product} />
      </div>

      <section className="pt-1 sm:pt-3" aria-labelledby="product-title">
        <Eyebrow>{product.category_name || 'Sản phẩm'}</Eyebrow>
        <h1 id="product-title" className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
          {product.name}
        </h1>
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-ink-soft sm:text-base">
          {product.description || 'Thông tin sản phẩm đang được cập nhật.'}
        </p>

        <div className="mt-7 rounded-card border border-line bg-white p-4 sm:p-5">
          {variants.length > 0 ? (
            <>
              <label className="block text-sm font-bold text-ink" htmlFor="product-variant">Chọn phiên bản</label>
              <select
                id="product-variant"
                className={`${inputClass} mt-2`}
                value={selectedVariant ? String(selectedVariant.id) : ''}
                onChange={(event) => {
                  setSelectedVariantId(event.target.value)
                  setQuantity(1)
                  setCartMessage('')
                }}
              >
                {variants.map((variant) => {
                  const variantName = [variant.flavor, variant.size].filter(Boolean).join(' · ')
                  return <option key={variant.id} value={variant.id}>{variantName || `Phiên bản ${variant.id}`}</option>
                })}
              </select>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Giá</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-ink" aria-live="polite">{formatPrice(selectedVariant?.price)}</p>
                </div>
                <p className={`inline-flex items-center gap-2 text-sm font-semibold ${Number(selectedVariant?.stock) > 0 ? 'text-brand-700' : 'text-red-600'}`} aria-live="polite">
                  {Number(selectedVariant?.stock) > 0 ? <Check size={17} aria-hidden="true" /> : <CircleAlert size={17} aria-hidden="true" />}
                  {Number(selectedVariant?.stock) > 0 ? `Còn ${selectedVariant.stock} sản phẩm` : 'Hết hàng'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-4">
                <div>
                  <span className="mb-2 block text-xs font-bold text-ink-soft">Số lượng</span>
                  <div className="flex min-h-12 items-center rounded-xl border border-line bg-white">
                    <button className="grid size-11 place-items-center rounded-l-xl text-ink-soft hover:bg-paper disabled:opacity-40" type="button" aria-label="Giảm số lượng" disabled={quantity <= 1 || Number(selectedVariant?.stock) <= 0} onClick={() => updateQuantity(quantity - 1)}>
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <output className="min-w-9 text-center text-sm font-bold" aria-live="polite">{quantity}</output>
                    <button className="grid size-11 place-items-center rounded-r-xl text-ink-soft hover:bg-paper disabled:opacity-40" type="button" aria-label="Tăng số lượng" disabled={quantity >= Number(selectedVariant?.stock) || Number(selectedVariant?.stock) <= 0} onClick={() => updateQuantity(quantity + 1)}>
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <button
                  className={`${buttonClass} min-w-48 flex-1 bg-ink text-white hover:bg-brand-700`}
                  type="button"
                  disabled={!selectedVariant || Number(selectedVariant.stock) <= 0}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag size={18} aria-hidden="true" /> Thêm vào giỏ
                </button>
              </div>
              {cartMessage && <p className="mt-3 text-sm text-ink-soft" role="status" aria-live="polite">{cartMessage}</p>}
            </>
          ) : (
            <EmptyState title="Sản phẩm chưa có phiên bản" description="Phiên bản, giá và tồn kho sẽ hiển thị tại đây khi được thêm vào danh mục." />
          )}
        </div>

        <p className="mt-4 text-xs leading-5 text-muted">Giá và tồn kho thay đổi theo phiên bản bạn chọn.</p>
      </section>
    </main>
  )
}

function StoreProductDetailPage() {
  const { productId } = useParams()

  // Lấy sản phẩm cùng các phiên bản từ API công khai.
  const productQuery = useApiQuery({
    queryKey: ['store-product-detail'],
    url: `/store/products/${productId}`,
    enabled: Boolean(productId),
    retry: false,
  })

  const product = productQuery.data

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-ink-soft hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700" to="/shop">
        <ArrowLeft size={17} aria-hidden="true" /> Quay lại cửa hàng
      </Link>

      {productQuery.isPending ? (
        // Khung giữ chỗ giúp bố cục ổn định trong lúc tải dữ liệu.
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14" role="status" aria-label="Đang tải thông tin sản phẩm">
          <Skeleton className="aspect-square w-full rounded-card sm:rounded-[1.75rem]" />
          <div className="space-y-5 py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : productQuery.isError ? (
        // Có nút quay lại và tải lại khi API gặp lỗi hoặc không tìm thấy sản phẩm.
        <div className="mt-6 rounded-card border border-line bg-white p-6 text-center">
          <EmptyState icon={CircleAlert} title="Chưa tải được sản phẩm" description={productQuery.error.message} />
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button className={`${buttonClass} bg-ink text-white hover:bg-brand-700`} type="button" onClick={() => productQuery.refetch()}>Thử tải lại</button>
            <Link className={`${buttonClass} border border-line bg-white text-ink hover:bg-paper`} to="/shop">Về cửa hàng</Link>
          </div>
        </div>
      ) : product ? (
        <ProductDetailContent key={product.id} product={product} />
      ) : null}
    </div>
  )
}

export default StoreProductDetailPage
