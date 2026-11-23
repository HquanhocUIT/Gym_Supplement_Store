import { useEffect, useState } from 'react'
import { CircleAlert, Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, Pagination, SkeletonCard } from '../components/common/index.js'
import { Eyebrow } from '../components/Brand.jsx'
import useApiQuery from '../hooks/useApiQuery.js'

const PAGE_SIZE = 12

const inputClass = 'min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const selectClass = `${inputClass} cursor-pointer`

// Hiển thị giá theo định dạng tiền Việt Nam.
function formatPrice(value) {
  if (value === null || value === undefined) return 'Chưa có giá'

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

// Hiện ảnh sản phẩm hoặc khung giữ chỗ nếu sản phẩm chưa có ảnh.
function ProductImage({ product }) {
  const [imageFailed, setImageFailed] = useState(false)

  if (!product.image_url || imageFailed) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-brand-50 text-brand-700" role="img" aria-label="Sản phẩm chưa có ảnh">
        <ShoppingBag size={36} strokeWidth={1.5} aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      className="aspect-[4/3] w-full rounded-2xl bg-paper object-cover"
      src={product.image_url}
      alt={product.name}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  )
}

function StoreShopPage() {
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
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
  let resultStatus = 'Đang tải sản phẩm…'
  if (priceRangeInvalid) resultStatus = 'Khoảng giá chưa hợp lệ'
  else if (productsQuery.isError) resultStatus = 'Chưa tải được sản phẩm'
  else if (pagination) resultStatus = `${pagination.total} sản phẩm`

  // Xóa bộ lọc giúp quay lại toàn bộ danh mục sản phẩm.
  function clearFilters() {
    setSearch('')
    setCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      {/* Tiêu đề và mô tả trang cửa hàng. */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Form &amp; Fuel · Store</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.06em] text-ink sm:text-5xl">Shop supplements</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
            Tìm sản phẩm phù hợp với lịch tập và mục tiêu của bạn.
          </p>
        </div>
        <p className="text-sm font-semibold text-ink-soft" aria-live="polite">
          {resultStatus}
        </p>
      </header>

      {/* Thanh tìm kiếm và bộ lọc trên cả màn hình lớn lẫn điện thoại. */}
      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5" aria-label="Tìm kiếm và lọc sản phẩm">
        {/* Chia lại số cột theo màn hình để bộ lọc không tràn ở tablet. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <label className="relative block">
            <span className="mb-2 block text-xs font-bold text-ink-soft">Tìm sản phẩm</span>
            <Search className="pointer-events-none absolute left-3 top-[2.65rem] text-muted" size={17} aria-hidden="true" />
            <input
              className={`${inputClass} pl-10 pr-10`}
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Tên sản phẩm…"
              aria-label="Tìm theo tên sản phẩm"
            />
            {search && (
              <button className="absolute right-0 top-6 grid size-11 place-items-center rounded-lg text-muted hover:bg-paper hover:text-ink" type="button" onClick={() => { setSearch(''); setPage(1) }} aria-label="Xóa từ khóa tìm kiếm">
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Danh mục</span>
            <select className={selectClass} value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
              <option value="">Tất cả danh mục</option>
              {(categoriesQuery.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Giá từ (₫)</span>
            <input className={inputClass} type="number" min="0" step="1" inputMode="numeric" value={minPrice} onChange={(event) => { setMinPrice(event.target.value); setPage(1) }} placeholder="Không giới hạn" />
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Giá đến (₫)</span>
            <input className={inputClass} type="number" min="0" step="1" inputMode="numeric" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value); setPage(1) }} placeholder="Không giới hạn" />
          </label>

          <label>
            <span className="mb-2 block text-xs font-bold text-ink-soft">Sắp xếp</span>
            <select className={selectClass} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
              <option value="newest">Mới nhất</option>
              <option value="name_asc">Tên: A đến Z</option>
              <option value="name_desc">Tên: Z đến A</option>
              <option value="price_asc">Giá: thấp đến cao</option>
              <option value="price_desc">Giá: cao đến thấp</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="inline-flex items-center gap-2 text-xs text-muted"><SlidersHorizontal size={15} aria-hidden="true" /> Bộ lọc áp dụng tự động</p>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-ink-soft transition hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700" type="button" onClick={clearFilters}>
            <X size={15} aria-hidden="true" /> Xóa bộ lọc
          </button>
        </div>
      </section>

      {/* Danh mục lỗi có nút tải lại riêng để người mua tiếp tục lọc. */}
      {categoriesQuery.isError && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700" role="alert">
          <p>Chưa tải được danh mục.</p>
          <button className="min-h-11 rounded-lg px-3 font-bold underline" type="button" onClick={() => categoriesQuery.refetch()}>Tải lại danh mục</button>
        </div>
      )}

      {/* Báo lỗi khoảng giá ngay cạnh bộ lọc trước khi hiển thị lỗi từ API. */}
      {priceRangeInvalid && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Giá từ không được lớn hơn giá đến.
        </p>
      )}

      {/* Hiển thị trạng thái tải, lỗi, danh sách rỗng hoặc các thẻ sản phẩm. */}
      <section className="mt-7" aria-label="Danh sách sản phẩm" aria-busy={productsQuery.isFetching}>
        {priceRangeInvalid ? (
          <div className="rounded-card border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700" role="status">
            Hãy điều chỉnh khoảng giá để xem sản phẩm.
          </div>
        ) : productsQuery.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-label="Đang tải sản phẩm">
            {Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : productsQuery.isError ? (
          <div className="rounded-card border border-line bg-white p-6 text-center">
            <EmptyState icon={CircleAlert} title="Chưa tải được sản phẩm" description={productsQuery.error.message} />
            <button className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-700" type="button" onClick={() => productsQuery.refetch()}>
              Thử tải lại
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-card border border-line bg-white p-6">
            <EmptyState title="Không tìm thấy sản phẩm" description="Thử đổi từ khóa hoặc xóa bớt bộ lọc để xem thêm sản phẩm." action={<button className="min-h-11 rounded-xl bg-ink px-5 text-sm font-bold text-white hover:bg-brand-700" type="button" onClick={clearFilters}>Xóa bộ lọc</button>} />
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article className="group min-w-0 break-words rounded-card border border-line bg-white p-3 transition motion-safe:hover:-translate-y-1 hover:shadow-card" key={product.id}>
                  <Link className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700" to={`/product/${product.id}`} aria-label={`Xem chi tiết ${product.name}`}>
                    <ProductImage product={product} />
                    <div className="px-1 pb-2 pt-4">
                      <p className="text-xs font-semibold text-brand-700">{product.category_name}</p>
                      <h2 className="mt-1 font-display text-base font-bold text-ink">{product.name}</h2>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-ink-soft">{product.description || 'Thông tin sản phẩm đang được cập nhật.'}</p>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Giá từ</p>
                          <p className="mt-1 text-sm font-extrabold text-ink">{formatPrice(product.lowest_price)}</p>
                        </div>
                        <p className={`text-xs font-semibold ${Number(product.total_stock) > 0 ? 'text-brand-700' : 'text-red-600'}`}>
                          {Number(product.total_stock) > 0 ? `Còn ${product.total_stock}` : 'Hết hàng'}
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
        Đã là hội viên? <Link className="font-bold text-brand-700 underline-offset-4 hover:underline" to="/member">Mở khu vực hội viên</Link>
      </p>
    </div>
  )
}

export default StoreShopPage
