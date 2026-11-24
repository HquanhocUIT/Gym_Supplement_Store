import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, CircleAlert, Minus, Plus, ShoppingBag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Skeleton } from '../components/common/index.js'
import { Eyebrow } from '../components/Brand.jsx'
import useApiQuery from '../hooks/useApiQuery.js'
import { getAccessToken } from '../lib/authToken.js'
import { addCartItem } from '../lib/cartApi.js'
import ProductPhoto from '../components/common/ProductPhoto.jsx'

const inputClass = 'min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50'

// Hiển thị tiền theo định dạng VND.
function formatPrice(value) {
  if (value === null || value === undefined) return 'Price unavailable'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

// Thông tin mua hàng và phiên bản được tách riêng để trạng thái bắt đầu lại khi đổi sản phẩm.
function ProductDetailContent({ product }) {
  const queryClient = useQueryClient()
  const [selectedVariantId, setSelectedVariantId] = useState(() => String(product.variants?.[0]?.id || ''))
  const [quantity, setQuantity] = useState(1)
  const [cartMessage, setCartMessage] = useState('')
  const variants = product?.variants || []
  const selectedVariant = variants.find((variant) => String(variant.id) === selectedVariantId) || variants[0]

  // Gửi món đã chọn lên API rồi cập nhật số lượng hiển thị trên header.
  const addToCartMutation = useMutation({
    mutationFn: () => addCartItem(Number(selectedVariant.id), quantity),
    onSuccess: () => {
      setCartMessage('Added to your cart.')
      queryClient.invalidateQueries({ queryKey: ['store-cart'] })
    },
  })

  // Giới hạn số lượng chọn không vượt quá tồn kho của phiên bản đang xem.
  function updateQuantity(nextQuantity) {
    const maximum = Number(selectedVariant?.stock || 0)
    setQuantity(Math.min(Math.max(1, nextQuantity), Math.max(1, maximum)))
    setCartMessage('')
  }

  // Yêu cầu đăng nhập trước khi gọi API giỏ hàng.
  function handleAddToCart() {
    setCartMessage('')

    if (!getAccessToken()) {
      setCartMessage('Please sign in to add this product to your cart.')
      return
    }

    addToCartMutation.mutate()
  }

  return (
    // Chi tiết, ảnh, lựa chọn phiên bản và thông tin mua hàng.
    <div className="mt-6 grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-14">
      <div className="rounded-card border border-line bg-white p-3 shadow-card sm:p-5">
        <ProductPhoto product={product} className="aspect-square rounded-card sm:rounded-[1.75rem]" loading="eager" />
      </div>

      <section className="min-w-0 pt-1 sm:pt-3" aria-labelledby="product-title">
        <Eyebrow>{product.category_name || 'Product'}</Eyebrow>
        <h1 id="product-title" className="mt-3 break-words font-display text-3xl font-extrabold leading-tight tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
          {product.name}
        </h1>
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-ink-soft sm:text-base">
          {product.description || 'Product details are being updated.'}
        </p>

        <div className="mt-7 rounded-card border border-line bg-white p-4 sm:p-5">
          {variants.length > 0 ? (
            <>
              <label className="block text-sm font-bold text-ink" htmlFor="product-variant">Choose a variant</label>
              <select
                id="product-variant"
                className={`${inputClass} mt-2`}
                value={selectedVariant ? String(selectedVariant.id) : ''}
                onChange={(event) => {
                  // Xóa lỗi của lựa chọn cũ khi người mua đổi phiên bản.
                  addToCartMutation.reset()
                  setSelectedVariantId(event.target.value)
                  setQuantity(1)
                  setCartMessage('')
                }}
              >
                {variants.map((variant) => {
                  const variantName = [variant.flavor, variant.size].filter(Boolean).join(' · ')
                  return <option key={variant.id} value={variant.id}>{variantName || `Variant ${variant.id}`}</option>
                })}
              </select>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Price</p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-ink" aria-live="polite">{formatPrice(selectedVariant?.price)}</p>
                </div>
                <p className={`inline-flex items-center gap-2 text-sm font-semibold ${Number(selectedVariant?.stock) > 0 ? 'text-brand-700' : 'text-red-600'}`} aria-live="polite">
                  {Number(selectedVariant?.stock) > 0 ? <Check size={17} aria-hidden="true" /> : <CircleAlert size={17} aria-hidden="true" />}
                  {Number(selectedVariant?.stock) > 0 ? `${selectedVariant.stock} in stock` : 'Out of stock'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-4">
                <div>
                  <span className="mb-2 block text-xs font-bold text-ink-soft">Quantity</span>
                  <div className="flex min-h-12 items-center rounded-xl border border-line bg-white">
                    <button className="grid size-11 place-items-center rounded-l-xl text-ink-soft hover:bg-paper disabled:opacity-40" type="button" aria-label="Decrease quantity" disabled={quantity <= 1 || Number(selectedVariant?.stock) <= 0} onClick={() => updateQuantity(quantity - 1)}>
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <output className="min-w-9 text-center text-sm font-bold" aria-live="polite">{quantity}</output>
                    <button className="grid size-11 place-items-center rounded-r-xl text-ink-soft hover:bg-paper disabled:opacity-40" type="button" aria-label="Increase quantity" disabled={quantity >= Number(selectedVariant?.stock) || Number(selectedVariant?.stock) <= 0} onClick={() => updateQuantity(quantity + 1)}>
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <button
                  className={`${buttonClass} min-w-48 flex-1 bg-ink text-white hover:bg-brand-700`}
                  type="button"
                  disabled={!selectedVariant || Number(selectedVariant.stock) <= 0 || addToCartMutation.isPending}
                  onClick={handleAddToCart}
                >
                  <ShoppingBag size={18} aria-hidden="true" /> {addToCartMutation.isPending ? 'Adding…' : 'Add to cart'}
                </button>
              </div>
              {(cartMessage || addToCartMutation.isError) && (
                <p className={`mt-3 text-sm ${addToCartMutation.isError ? 'text-red-700' : 'text-ink-soft'}`} role={addToCartMutation.isError ? 'alert' : 'status'} aria-live="polite">
                  {addToCartMutation.isError ? addToCartMutation.error.message : cartMessage}
                  {!getAccessToken() && <Link className="ml-1 font-bold underline underline-offset-4" to="/cart">Open your cart to sign in.</Link>}
                </p>
              )}
            </>
          ) : (
            <EmptyState title="No variants available" description="Variants, prices and stock will appear here when available." />
          )}
        </div>

        <p className="mt-4 text-xs leading-5 text-muted">Price and stock depend on the selected variant.</p>
      </section>
    </div>
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
        <ArrowLeft size={17} aria-hidden="true" /> Back to shop
      </Link>

      {productQuery.isPending ? (
        // Khung giữ chỗ giúp bố cục ổn định trong lúc tải dữ liệu.
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14" role="status" aria-label="Loading product details">
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
          <EmptyState icon={CircleAlert} title={productQuery.error.status === 404 ? 'Product not found' : 'Unable to load products'} description={productQuery.error.message} />
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button className={`${buttonClass} bg-ink text-white hover:bg-brand-700`} type="button" onClick={() => productQuery.refetch()}>Try again</button>
            <Link className={`${buttonClass} border border-line bg-white text-ink hover:bg-paper`} to="/shop">Back to shop</Link>
          </div>
        </div>
      ) : product ? (
        <ProductDetailContent key={product.id} product={product} />
      ) : null}
    </div>
  )
}

export default StoreProductDetailPage
