import { useEffect, useState } from 'react'
import { CircleAlert, Search, SlidersHorizontal, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, Pagination, SkeletonCard } from '../components/common/index.js'
import { Eyebrow } from '../components/Brand.jsx'
import useApiQuery from '../hooks/useApiQuery.js'
import ProductPhoto from '../components/common/ProductPhoto.jsx'
import useCatalogSearchParams from '../hooks/useCatalogSearchParams.js'

const PAGE_SIZE = 12

const inputClass = 'min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const selectClass = `${inputClass} cursor-pointer`

// Hiển thị giá theo định dạng tiền Việt Nam.
function formatPrice(value) {
  if (value === null || value === undefined) return 'Price unavailable'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

function StoreShopPage() {
  const { search, category, minPrice, maxPrice, sort, page, updateFilters, setPage, clearFilters } = useCatalogSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => search.trim())
  const priceRangeInvalid = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice)

  // Đợi người dùng ngừng gõ một chút rồi mới gọi API tìm kiếm.
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  // Lấy danh mục để người dùng chọn bộ lọc.
  const categoriesQuery = useApiQuery({
    queryKey: ['store-categories'],
    url: '/store/categories',
    retry: false,
  })

  // Chỉ gửi khoảng giá khi ô có giá trị; backend kiểm tra định dạng và khoảng hợp lệ.
  const productParams = {
    q: searchQuery || undefined,
    category: category || undefined,
    minPrice: minPrice === '' ? undefined : minPrice,
    maxPrice: maxPrice === '' ? undefined : maxPrice,
    sort,
    page,
    limit: PAGE_SIZE,
  }

  // Tải danh sách theo từ khóa, bộ lọc, thứ tự sắp xếp và trang hiện tại.
  const productsQuery = useApiQuery({
    queryKey: ['store-products'],
    url: '/store/products',
    params: productParams,
    enabled: !priceRangeInvalid,
    retry: false,
  })

  const products = productsQuery.data?.items || []
  const pagination = productsQuery.data?.pagination
  // Dòng thống kê phản ánh cả lỗi và khoảng giá chưa hợp lệ.
  let resultStatus = 'Loading products…'
  if (priceRangeInvalid) resultStatus = 'Invalid price range'
  else if (productsQuery.isError) resultStatus = 'Unable to load products'
  else if (pagination) resultStatus = `${pagination.total} items`

  return (
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      {/* Tiêu đề và mô tả trang cửa hàng. */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Form &amp; Fuel · Store</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">Shop supplements</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Find supplements and accessories for your training goals.
          </p>
        </div>
        <p className="text-sm font-semibold text-ink-soft" aria-live="polite">
          {resultStatus}
        </p>
      </header>

      {/* Thanh tìm kiếm và bộ lọc trên cả màn hình lớn lẫn điện thoại. */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5" aria-label="Search and filter products">
        {/* Chia lại số cột theo màn hình để bộ lọc không tràn ở tablet. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <label className="relative block">
            <span className="mb-2 block text-xs font-bold text-ink-soft">Search products</span>
            <Search className="pointer-events-none absolute left-3 top-[2.65rem] text-muted" size={17} aria-hidden="true" />
            <input
              className={`${inputClass} pl-10 pr-10`}
              type="search"
              value={search}
              onChange={(event) => updateFilters({ q: event.target.value })}
              placeholder="Product name…"
              aria-label="Search by product name"
            />
            {search && (
              <button className="absolute right-0 top-6 grid size-11 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink" type="button" onClick={() => updateFilters({ q: '' })} aria-label="Clear search">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Category</span>
            <select className={selectClass} value={category} onChange={(event) => updateFilters({ category: event.target.value })}>
              <option value="">All categories</option>
              {(categoriesQuery.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Minimum price (VND)</span>
            <input className={inputClass} type="number" min="0" step="1" inputMode="numeric" value={minPrice} onChange={(event) => updateFilters({ minPrice: event.target.value })} placeholder="Any" />
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Maximum price (VND)</span>
            <input className={inputClass} type="number" min="0" step="1" inputMode="numeric" value={maxPrice} onChange={(event) => updateFilters({ maxPrice: event.target.value })} placeholder="Any" />
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Sort by</span>
            <select className={selectClass} value={sort} onChange={(event) => updateFilters({ sort: event.target.value })}>
              <option value="newest">Newest</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="price_asc">Price low to high</option>
              <option value="price_desc">Price high to low</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="inline-flex items-center gap-2 text-xs text-muted"><SlidersHorizontal size={15} aria-hidden="true" /> Filters apply automatically</p>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink-soft transition hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700" type="button" onClick={clearFilters}>
            <X size={15} aria-hidden="true" /> Clear filters
          </button>
        </div>
      </section>

      {/* Danh mục lỗi có nút tải lại riêng để người mua tiếp tục lọc. */}
      {categoriesQuery.isError && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700" role="alert">
          <p>Unable to load categories.</p>
          <button className="min-h-11 rounded-lg px-3 font-bold underline" type="button" onClick={() => categoriesQuery.refetch()}>Retry categories</button>
        </div>
      )}

      {/* Báo lỗi khoảng giá ngay cạnh bộ lọc trước khi hiển thị lỗi từ API. */}
      {priceRangeInvalid && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Minimum price cannot exceed maximum price.
        </p>
      )}

      {/* Hiển thị trạng thái tải, lỗi, danh sách rỗng hoặc các thẻ sản phẩm. */}
      <section className="mt-7" aria-label="Product list" aria-busy={productsQuery.isFetching}>
        {priceRangeInvalid ? (
          <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700" role="status">
            Adjust the price range to view products.
          </div>
        ) : productsQuery.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Loading products">
            {Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-card border border-line bg-white p-6 text-center">
            <EmptyState icon={CircleAlert} title="Unable to load products" description={productsQuery.error.message} />
            <button className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-700" type="button" onClick={() => productsQuery.refetch()}>
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-card border border-line bg-white p-6">
            <EmptyState title="Product not found" description="Try another search or clear filters to see more products." action={<button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-700" type="button" onClick={clearFilters}>Clear filters</button>} />
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article className="group min-w-0 break-words rounded-card border border-line bg-white p-3 transition motion-safe:hover:-translate-y-1 hover:shadow-card" key={product.id}>
                  <Link className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700" to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
                    <ProductPhoto product={product} />
                    <div className="px-1 pb-2 pt-4">
                      <p className="text-xs font-semibold text-brand-700">{product.category_name}</p>
                      <h2 className="mt-1 font-display text-base font-bold text-ink">{product.name}</h2>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-ink-soft">{product.description || 'Product details are being updated.'}</p>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">From</p>
                          <p className="mt-1 text-sm font-extrabold text-ink">{formatPrice(product.lowest_price)}</p>
                        </div>
                        <p className={`text-xs font-semibold ${Number(product.total_stock) > 0 ? 'text-brand-700' : 'text-red-600'}`}>
                          {Number(product.total_stock) > 0 ? `${product.total_stock} in stock` : 'Out of stock'}
                        </p>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Dùng component phân trang chung để các trang có cùng hành vi. */}
            {pagination && pagination.total > PAGE_SIZE && (
              <div className="mt-8 rounded-card border border-line bg-white p-4 sm:px-5">
                <Pagination page={pagination.page} pageSize={pagination.limit} total={pagination.total} onPageChange={setPage} disabled={productsQuery.isFetching} />
              </div>
            )}
          </>
        )}
      </section>

      {/* Gợi ý đăng nhập cho luồng thành viên hiện có. */}
      <p className="mt-10 text-center text-sm text-muted">
        Already a member? <Link className="font-bold text-brand-700 underline-offset-4 hover:underline" to="/member">Open member area</Link>
      </p>
    </div>
  )
}

export default StoreShopPage
