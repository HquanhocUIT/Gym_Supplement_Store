import Input from '../components/ui/Input.jsx'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CircleAlert, PackageCheck, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Eyebrow } from '../components/Brand.jsx'
import { login } from '../lib/authApi.js'
import { clearAccessToken, getAccessToken, saveAccessToken } from '../lib/authToken.js'
import { getCart } from '../lib/cartApi.js'
import { requestApiData } from '../lib/apiClient.js'
import { Skeleton } from '../components/common/index.js'

// Hiển thị tiền theo định dạng VND, tổng chính thức lấy từ phản hồi checkout.
const formatPrice = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0))

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50'
const inputClass = 'min-h-12 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

// Nhập địa chỉ, xem tạm tính và gửi yêu cầu đặt hàng COD.
function StoreCheckoutPage() {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => Boolean(getAccessToken()))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [form, setForm] = useState({ recipient_name: '', recipient_phone: '', shipping_address: '' })

  // Đồng bộ trạng thái đăng nhập nếu token được cập nhật trong tab hiện tại.
  useEffect(() => {
    const updateTokenState = () => setHasToken(Boolean(getAccessToken()))
    window.addEventListener('auth-token-changed', updateTokenState)
    return () => window.removeEventListener('auth-token-changed', updateTokenState)
  }, [])

  // Giỏ chỉ được tải sau khi có token.
  const cartQuery = useQuery({
    queryKey: ['store-cart'],
    queryFn: getCart,
    enabled: hasToken,
    retry: false,
  })

  // Đăng nhập ngay trên trang này để người mua không mất thông tin giao hàng.
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

  // Backend tính tổng tiền cuối cùng, áp dụng membership và trừ kho trong một transaction.
  const checkoutMutation = useMutation({
    mutationFn: () => requestApiData('post', '/store/orders', { ...form, payment_method: 'cod' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-cart'] })
      queryClient.invalidateQueries({ queryKey: ['member-account'] })
    },
    // Sau xung đột tồn kho, tải lại giỏ để người mua thấy số lượng hiện tại.
    onError: (error) => {
      if (error.code === 'INSUFFICIENT_STOCK') queryClient.invalidateQueries({ queryKey: ['store-cart'] })
    },
  })

  const cart = cartQuery.data
  const items = cart?.items || []
  const subtotal = Number(cart?.subtotal || 0)
  const placedOrder = checkoutMutation.data?.order
  const hasStockIssue = items.some((item) => Number(item.quantity) > Number(item.variant.stock))
  const isUnauthorized = cartQuery.error?.status === 401

  // Đưa tiêu điểm tới xác nhận để người dùng bàn phím nhận biết đã đặt hàng.
  useEffect(() => {
    if (placedOrder) document.getElementById('order-success-title')?.focus()
  }, [placedOrder])

  function handleSignOut() {
    clearAccessToken()
    setHasToken(false)
    queryClient.removeQueries({ queryKey: ['store-cart'] })
  }

  // Hiện xác nhận từ POST và cho khách mở lại đơn sau khi tải lại trang.
  if (placedOrder) {
    return (
      <section className="mx-auto min-h-[60vh] max-w-2xl break-words px-4 py-12 sm:px-6" aria-labelledby="order-success-title">
        <PackageCheck size={40} className="text-brand-700" aria-hidden="true" />
        <h1 id="order-success-title" className="mt-4 font-display text-3xl font-extrabold" tabIndex={-1}>Order placed</h1>
        <p className="mt-3" role="status">Order #{placedOrder.id} is awaiting confirmation. Payment is due on delivery.</p>
        <dl className="mt-6 space-y-3 rounded-card border border-line bg-white p-5">
          <div className="flex flex-wrap justify-between gap-2"><dt>Subtotal</dt><dd>{formatPrice(placedOrder.subtotal)}</dd></div>
          <div className="flex flex-wrap justify-between gap-2"><dt>Member discount</dt><dd>{formatPrice(placedOrder.discount_amount)}</dd></div>
          <div className="flex flex-wrap justify-between gap-2 font-bold"><dt>Order total</dt><dd>{formatPrice(placedOrder.total_amount)}</dd></div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3"><Link className={`${buttonClass} bg-ink text-white`} to={`/member/orders/${placedOrder.id}`}>View order details</Link><Link className={`${buttonClass} border border-line`} to="/shop">Continue shopping</Link></div>
      </section>
    )
  }

  return (
    <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-ink-soft hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700" to="/cart">
        <ArrowLeft size={17} aria-hidden="true" /> Back to cart
      </Link>

      <header className="mt-6">
        <Eyebrow>Gym Bro · Checkout</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">Checkout</h1>
        <p className="mt-2 text-sm text-ink-soft">Pay when your order arrives with cash on delivery.</p>
      </header>

      {!hasToken ? (
        <section className="mx-auto mt-8 max-w-xl rounded-card border border-line bg-white p-5 shadow-card sm:p-7" aria-labelledby="checkout-login-title">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><ShoppingBag size={22} aria-hidden="true" /></span>
          <h2 id="checkout-login-title" className="mt-4 font-display text-xl font-extrabold">Sign in to check out</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">Your cart and orders are saved to your account.</p>
          <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); loginMutation.mutate() }}>
            <label className="block text-sm font-semibold text-ink" htmlFor="checkout-email">Email
              <input className={`${inputClass} mt-2`} id="checkout-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-semibold text-ink" htmlFor="checkout-password">Password
              <Input className={`${inputClass} mt-2`} id="checkout-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {loginError && <p className="text-sm text-red-700" role="alert">{loginError}</p>}
            <button className={`${buttonClass} w-full bg-ink text-white hover:bg-brand-700`} type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </section>
      ) : cartQuery.isPending ? (
        <div className="mt-8 space-y-4 rounded-card border border-line bg-white p-6" role="status" aria-label="Loading your cart">
          <Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" />
        </div>
      ) : cartQuery.isError ? (
        <section className="mt-8 rounded-card border border-line bg-white p-6 text-center">
          <CircleAlert className="mx-auto text-red-600" size={28} aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-extrabold">{isUnauthorized ? 'Your session has expired' : 'Unable to load your cart'}</h2>
          <p className="mt-2 text-sm text-ink-soft">{isUnauthorized ? 'Sign in again to continue.' : cartQuery.error.message}</p>
          {isUnauthorized ? (
            <button className={`${buttonClass} mt-4 bg-ink text-white hover:bg-brand-700`} type="button" onClick={handleSignOut}>Sign in again</button>
          ) : (
            <button className={`${buttonClass} mt-4 bg-ink text-white hover:bg-brand-700`} type="button" onClick={() => cartQuery.refetch()}>Try again</button>
          )}
        </section>
      ) : items.length === 0 ? (
        <section className="mt-8 rounded-card border border-line bg-white px-5 py-12 text-center">
          <PackageCheck className="mx-auto text-brand-700" size={30} aria-hidden="true" />
          <h2 className="mt-4 font-display text-xl font-extrabold">Your cart is empty</h2>
          <p className="mt-2 text-sm text-ink-soft">Add a product to your cart before checking out.</p>
          <Link className={`${buttonClass} mt-5 bg-ink text-white hover:bg-brand-700`} to="/shop">Browse products</Link>
        </section>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form
            className="rounded-card border border-line bg-white p-5 shadow-card sm:p-7"
            aria-busy={checkoutMutation.isPending}
            onSubmit={(event) => { event.preventDefault(); checkoutMutation.mutate() }}
          >
            <h2 className="font-display text-xl font-extrabold">Delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink sm:col-span-2" htmlFor="recipient-name">Recipient name
                <input className={`${inputClass} mt-2`} id="recipient-name" name="recipient_name" autoComplete="name" maxLength={255} required value={form.recipient_name} onChange={(event) => setForm({ ...form, recipient_name: event.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-ink sm:col-span-2" htmlFor="recipient-phone">Phone number
                <input className={`${inputClass} mt-2`} id="recipient-phone" name="recipient_phone" type="tel" autoComplete="tel" maxLength={30} required value={form.recipient_phone} onChange={(event) => setForm({ ...form, recipient_phone: event.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-ink sm:col-span-2" htmlFor="shipping-address">Delivery address
                <textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100" id="shipping-address" name="shipping_address" autoComplete="street-address" required value={form.shipping_address} onChange={(event) => setForm({ ...form, shipping_address: event.target.value })} />
              </label>
            </div>
            {hasStockIssue && <p className="mt-4 text-sm text-red-700" role="alert">The quantity exceeds available stock. Return to your cart to update it.</p>}
            {checkoutMutation.isError && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {checkoutMutation.error.message} Please review your cart and try again.
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button className={`${buttonClass} flex-1 bg-ink text-white hover:bg-brand-700`} type="submit" disabled={checkoutMutation.isPending || cartQuery.isFetching || hasStockIssue}>
                {checkoutMutation.isPending ? 'Placing order…' : 'Place order — pay on delivery'}
              </button>
              <Link className={`${buttonClass} border border-line bg-white text-ink hover:bg-paper`} to="/cart">Edit cart</Link>
            </div>
          </form>

          <aside className="rounded-card border border-line bg-white p-5 sm:p-6" aria-label="Order summary">
            <h2 className="font-display text-lg font-extrabold">Order summary</h2>
            <ul className="mt-4 space-y-3 border-b border-line pb-4">
              {items.map((item) => (
                <li className="flex justify-between gap-4 text-sm" key={item.id}>
                  <span className="min-w-0 text-ink-soft">{item.variant.product_name} × {item.quantity}</span>
                  <span className="shrink-0 font-semibold text-ink">{formatPrice(Number(item.variant.price) * Number(item.quantity))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between gap-4 text-sm text-ink-soft">
              <span>Subtotal</span><span className="font-bold text-ink">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Members with a valid gym membership receive 10% off. Your discount and final total are confirmed when the order is placed.</p>
            <p className="mt-3 text-xs text-ink-soft">Cash on delivery</p>
          </aside>
        </div>
      )}
    </div>
  )
}

export default StoreCheckoutPage
