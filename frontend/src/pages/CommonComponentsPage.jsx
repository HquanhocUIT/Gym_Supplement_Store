import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleAlert, CircleCheck, RefreshCw } from 'lucide-react'
import { EmptyState, ImageUploader, Pagination, SkeletonCard } from '../components/common/index.js'
import { Eyebrow } from '../components/Brand.jsx'
import useApiQuery from '../hooks/useApiQuery.js'

// Dữ liệu mẫu chỉ dùng để kiểm tra phân trang, chưa thay thế API sản phẩm.
const products = ['Whey Protein', 'Creatine', 'Pre-workout', 'BCAA', 'Multivitamin', 'Fish Oil', 'Glutamine', 'Casein', 'Mass Gainer', 'L-Carnitine', 'Lifting Strap', 'Lifting Belt']
const pageSize = 4
const buttonClass = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-ink transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50'

export default function CommonComponentsPage() {
  const [page, setPage] = useState(1)
  const [showEmpty, setShowEmpty] = useState(false)
  const [image, setImage] = useState(null)

  // Chỉ gọi API khi bấm nút để có thể chụp cả trạng thái chưa tải và đã tải.
  const health = useApiQuery({ queryKey: ['health'], url: '/health', enabled: false, retry: false })
  const visibleProducts = products.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/ui-kit" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-soft hover:text-brand-700"><ArrowLeft size={16} aria-hidden="true" /> Về UI Kit</Link>
      <header className="mb-8 mt-4">
        <Eyebrow>Task 06 · Thành phần dùng chung</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Common components</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">Kiểm tra API, trạng thái dữ liệu, phân trang và ảnh sản phẩm trước khi dùng trong các trang chính.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Minh chứng Axios và TanStack Query gọi health endpoint thật. */}
        <section className="rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="api-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold" id="api-heading">01. Kết nối API</h2>
            <button type="button" className={buttonClass} disabled={health.isFetching} onClick={() => health.refetch()}><RefreshCw size={16} aria-hidden="true" />{health.isFetching ? 'Đang kiểm tra…' : 'Kiểm tra API'}</button>
          </div>
          <div className="mt-5" aria-busy={health.isFetching}>
            {health.isFetching ? (
              <div role="status"><span className="sr-only">Đang kiểm tra kết nối API</span><SkeletonCard /></div>
            ) : health.isError ? (
              <EmptyState icon={CircleAlert} title="Chưa kết nối được API" description={health.error.message} />
            ) : health.isSuccess ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-5" role="status">
                <p className="flex items-center gap-2 font-bold text-brand-700"><CircleCheck size={20} aria-hidden="true" /> API đang hoạt động</p>
                <dl className="mt-4 space-y-3 text-sm text-ink-soft">
                  <div className="flex justify-between gap-4"><dt>Trạng thái</dt><dd className="font-bold text-ink">{health.data.status}</dd></div>
                  <div className="flex flex-wrap justify-between gap-2"><dt>Thời gian phản hồi</dt><dd>{new Date(health.data.timestamp).toLocaleString('vi-VN')}</dd></div>
                </dl>
              </div>
            ) : (
              <EmptyState title="Chưa kiểm tra kết nối" description="Chạy backend rồi bấm Kiểm tra API để lấy dữ liệu từ /api/health." />
            )}
          </div>
        </section>

        {/* Mẫu skeleton luôn có sẵn để xem bố cục khi API đang tải. */}
        <section className="rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="loading-heading">
          <h2 className="font-display text-xl font-bold" id="loading-heading">02. Trạng thái đang tải</h2>
          <p className="mb-5 mt-2 text-sm leading-6 text-ink-soft">Skeleton giữ chỗ cho ảnh và nội dung trong lúc chờ dữ liệu.</p>
          <div className="mx-auto max-w-xs" role="status"><span className="sr-only">Mẫu trạng thái đang tải sản phẩm</span><SkeletonCard /></div>
        </section>

        {/* Đổi giữa dữ liệu mẫu và danh sách rỗng để kiểm tra component. */}
        <section className="rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="pagination-heading">
          <h2 className="font-display text-xl font-bold" id="pagination-heading">03. Danh sách và phân trang</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className={buttonClass} type="button" aria-pressed={!showEmpty} onClick={() => setShowEmpty(false)}>Dữ liệu mẫu</button>
            <button className={buttonClass} type="button" aria-pressed={showEmpty} onClick={() => { setShowEmpty(true); setPage(1) }}>Danh sách rỗng</button>
          </div>
          {showEmpty ? <EmptyState title="Chưa có sản phẩm" description="Sản phẩm sẽ xuất hiện tại đây khi có dữ liệu." /> : (
            <ul className="my-5 divide-y divide-line rounded-xl border border-line px-4">
              {visibleProducts.map((name, index) => <li className="flex items-center gap-3 py-4 text-sm font-semibold text-ink" key={name}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper text-ink-soft">{(page - 1) * pageSize + index + 1}</span>{name}</li>)}
            </ul>
          )}
          <Pagination page={page} pageSize={pageSize} total={showEmpty ? 0 : products.length} onPageChange={setPage} />
        </section>

        {/* Ảnh chỉ được chọn và xem trước; API lưu ảnh thuộc Task 30. */}
        <section className="rounded-card border border-line bg-white p-5 sm:p-6" aria-labelledby="image-heading">
          <h2 className="font-display text-xl font-bold" id="image-heading">04. Chọn ảnh sản phẩm</h2>
          <p className="mb-5 mt-2 text-sm leading-6 text-ink-soft">Chọn ảnh để kiểm tra định dạng, dung lượng và xem trước. File được trả cho form, chưa tải lên server.</p>
          <ImageUploader value={image} onChange={setImage} />
        </section>
      </div>
    </div>
  )
}
