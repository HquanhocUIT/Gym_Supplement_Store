import Input from '../components/ui/Input.jsx'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, Minus, Package, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../components/common/index.js'
import { Eyebrow } from '../components/Brand.jsx'
import { login } from '../lib/authApi.js'
import { clearAccessToken, getAccessToken, saveAccessToken } from '../lib/authToken.js'
import { deleteCartItem, getCart, updateCartItem } from '../lib/cartApi.js'

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50'
const inputClass = 'min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

// Hiển thị số tiền theo định dạng tiền Việt Nam.
function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

// Hiển thị ảnh sản phẩm hoặc biểu tượng thay thế khi ảnh chưa có.
function CartProductImage({ imageUrl, productName }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!imageUrl || imageFailed) {
    return (
      <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 sm:size-28" role="img" aria-label={`${productName}, no image available`}>
        <Package size={30} strokeWidth={1.5} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      className="size-24 shrink-0 rounded-2xl bg-paper object-cover sm:size-28"
      src={imageUrl}
      alt={productName}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  )
}

// Trang giỏ hàng hỗ trợ đăng nhập, sửa số lượng và xóa món.
function StoreCartPage() {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => Boolean(getAccessToken()))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [cartActionError, setCartActionError] = useState('')

  // Chỉ yêu cầu giỏ hàng khi người dùng đã có access token.
  const cartQuery = useQuery({
    queryKey: ['store-cart'],
    queryFn: getCart,
    enabled: hasToken,
    retry: false,
  })

  // Đăng nhập ngay tại trang giỏ để lấy token dùng cho các API yêu cầu xác thực.
  const loginMutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: (result) => {
      saveAccessToken(result.access_token, result.user)
      setHasToken(true)
      setPassword('')
      setLoginError('')
      queryClient.invalidateQueries({ queryKey: ['store-cart'] })
    },
    onError: (error) => setLoginError(error.message),
  })

  // Cập nhật giỏ trên server rồi tải lại dữ liệu và badge ở header.
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => updateCartItem(itemId, quantity),
    onSuccess: () => {
      setCartActionError('')
      queryClient.invalidateQueries({ queryKey: ['store-cart'] })
    },
    onError: (error) => setCartActionError(error.message),
  })

  // Xóa món khỏi giỏ rồi đồng bộ lại tổng tiền và số lượng trên header.
  const deleteMutation = useMutation({
    mutationFn: (itemId) => deleteCartItem(itemId),
    onSuccess: () => {
      setCartActionError('')
      queryClient.invalidateQueries({ queryKey: ['store-cart'] })
    },
    onError: (error) => setCartActionError(error.message),
  })

  const cart = cartQuery.data
  const items = cart?.items || []
  const itemCount = items.reduce((total, item) => total + Number(item.quantity || 0), 0)
  const mutationPending = updateMutation.isPending || deleteMutation.isPending

  // Xóa token hết hạn để người dùng có thể đăng nhập lại.
  function handleSignOut() {
    clearAccessToken()
    setHasToken(false)
    setCartActionError('')
    queryClient.removeQueries({ queryKey: ['store-cart'] })
  }

  return (
    <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-ink-soft hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700" to="/shop">
        <ArrowLeft size={17} aria-hidden="true" /> Continue shopping
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Gym Bro · Your order</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">Shopping cart</h1>
          <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
            {hasToken ? `${itemCount} items in your cart` : 'Sign in to view your selected items.'}
          </p>
        </div>
        {hasToken && (
          <button className={`${buttonClass} border border-line bg-white text-ink-soft hover:bg-paper`} type="button" onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </header>

      {!hasToken ? (
        <section className="mx-auto mt-8 max-w-xl rounded-card border border-line bg-white p-5 shadow-card sm:p-7" aria-labelledby="cart-login-title">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShoppingBag size={22} aria-hidden="true" /></span>
          <h2 id="cart-login-title" className="mt-4 font-display text-xl font-extrabold">Sign in to view your cart</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Your cart is saved to your account so you can pick up where you left off.</p>

          <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); loginMutation.mutate() }}>
            <label className="block text-sm font-semibold text-ink" htmlFor="cart-email">
              Email
              <input className={`${inputClass} mt-2`} id="cart-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-ink" htmlFor="cart-password">
              Password
              <Input className={`${inputClass} mt-2`} id="cart-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {loginError && <p className="text-sm text-red-700" role="alert">{loginError}</p>}
            <button className={`${buttonClass} w-full bg-ink text-white hover:bg-brand-700`} type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </section>
      ) : cartQuery.isPending ? (
        <div className="mt-8 space-y-4 rounded-card border border-line bg-white p-6" role="status" aria-label="Loading your cart">
          <span className="sr-only">Loading your cart…</span>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : cartQuery.isError ? (
        <section className="mt-8 rounded-card border border-line bg-white p-6 text-center">
          <EmptyCartError error={cartQuery.error} onSignOut={handleSignOut} onRetry={() => cartQuery.refetch()} />
        </section>
      ) : items.length === 0 ? (
        <section className="mt-8 rounded-card border border-line bg-white px-5 py-12 text-center sm:px-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShoppingBag size={25} aria-hidden="true" /></span>
          <h2 className="mt-4 font-display text-xl font-extrabold">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-soft">Choose a product and variant to start your cart.</p>
          <Link className={`${buttonClass} mt-5 bg-ink text-white hover:bg-brand-700`} to="/shop">Browse products</Link>
        </section>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="min-w-0 overflow-hidden rounded-card border border-line bg-white" aria-label="Cart items" aria-busy={mutationPending}>
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const variant = item.variant
                const stock = Number(variant.stock || 0)
                const quantity = Number(item.quantity)
                const variantName = [variant.flavor, variant.size].filter(Boolean).join(' · ')
                const hasStockIssue = quantity > stock

                return (
                  <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5" key={item.id}>
                    <CartProductImage imageUrl={variant.image_url} productName={variant.product_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="break-words font-display text-base font-extrabold text-ink">{variant.product_name}</h2>
                          <p className="mt-1 text-sm text-ink-soft">{variantName || `Variant ${variant.id}`}</p>
                        </div>
                        <p className="font-bold text-ink">{formatPrice(variant.price)}</p>
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${hasStockIssue ? 'text-red-700' : 'text-muted'}`}>
                        {hasStockIssue ? `Only ${stock} left. Please reduce the quantity.` : `${stock} in stock`}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex min-h-11 items-center rounded-xl border border-line" aria-label={`Quantity ${variant.product_name}`}>
                          <button className="grid size-11 place-items-center rounded-l-xl text-ink-soft transition hover:bg-paper disabled:opacity-40" type="button" aria-label={`Decrease quantity ${variant.product_name}`} disabled={quantity <= 1 || mutationPending} onClick={() => updateMutation.mutate({ itemId: item.id, quantity: quantity - 1 })}>
                            <Minus size={15} aria-hidden="true" />
                          </button>
                          <output className="min-w-9 text-center text-sm font-bold" aria-live="polite">{quantity}</output>
                          <button className="grid size-11 place-items-center rounded-r-xl text-ink-soft transition hover:bg-paper disabled:opacity-40" type="button" aria-label={`Increase quantity ${variant.product_name}`} disabled={quantity >= stock || mutationPending} onClick={() => updateMutation.mutate({ itemId: item.id, quantity: quantity + 1 })}>
                            <Plus size={15} aria-hidden="true" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm font-extrabold text-ink">{formatPrice(Number(variant.price) * quantity)}</p>
                          <button className="grid size-11 place-items-center rounded-xl text-muted transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" type="button" aria-label={`Remove ${variant.product_name} from cart`} disabled={mutationPending} onClick={() => deleteMutation.mutate(item.id)}>
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            {cartActionError && <p className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-5" role="alert">{cartActionError}</p>}
          </section>

          <aside className="rounded-card border border-line bg-white p-5 sm:p-6" aria-label="Order summary">
            <h2 className="font-display text-lg font-extrabold">Cart summary</h2>
            <div className="mt-5 flex justify-between gap-4 text-sm text-ink-soft">
              <span>Subtotal ({itemCount} items)</span>
              <span className="font-bold text-ink">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">Your final total will be confirmed at checkout.</p>
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex justify-between gap-4 text-base font-extrabold">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              {/* Chặn checkout khi giỏ đang cập nhật hoặc số lượng vượt tồn kho. */}
              {items.some((item) => Number(item.quantity) > Number(item.variant.stock)) ? (
                <p className="mt-3 text-sm text-red-700" role="alert">Adjust quantities to match available stock before checkout.</p>
              ) : mutationPending || cartQuery.isFetching ? (
                <button className={`${buttonClass} mt-4 w-full bg-ink text-white`} type="button" disabled>Updating cart…</button>
              ) : (
                <Link className={`${buttonClass} mt-4 w-full bg-ink text-white hover:bg-brand-700`} to="/checkout">Proceed to checkout</Link>
              )}
            </div>
            <Link className={`${buttonClass} mt-5 w-full border border-line bg-white text-ink hover:bg-paper`} to="/shop">Back to shop</Link>
          </aside>
        </div>
      )}
    </div>
  )
}

// Hiển thị lỗi tải giỏ và cho phép thử lại hoặc đăng nhập lại.
function EmptyCartError({ error, onRetry, onSignOut }) {
  const isUnauthorized = error.status === 401

  return (
    <>
      <CircleAlert className="mx-auto text-red-600" size={28} aria-hidden="true" />
      <h2 className="mt-3 font-display text-lg font-extrabold">{isUnauthorized ? 'Your session has expired' : 'Unable to load your cart'}</h2>
      <p className="mt-2 text-sm text-ink-soft">{isUnauthorized ? 'Sign in again to view your cart.' : error.message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {isUnauthorized ? (
          <button className={`${buttonClass} bg-ink text-white hover:bg-brand-700`} type="button" onClick={onSignOut}>Sign in again</button>
        ) : (
          <button className={`${buttonClass} bg-ink text-white hover:bg-brand-700`} type="button" onClick={onRetry}>Try again</button>
        )}
        <Link className={`${buttonClass} border border-line bg-white text-ink hover:bg-paper`} to="/shop">Back to shop</Link>
      </div>
    </>
  )
}

export default StoreCartPage
