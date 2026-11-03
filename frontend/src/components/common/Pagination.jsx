import { ChevronLeft, ChevronRight } from 'lucide-react'

// Phân trang có điều khiển: trang cha giữ page và xử lý onPageChange.
export default function Pagination({ page, pageSize = 10, total = 0, onPageChange, disabled = false }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const firstItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, total)

  // Chỉ hiển thị trang đầu, trang cuối và các trang gần trang hiện tại.
  const pages = [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b)
  const buttonClass = 'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 aria-[current=page]:border-brand-700 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Phân trang">
      <p className="text-sm text-ink-soft" aria-live="polite">{firstItem}–{lastItem} / {total} kết quả</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonClass} type="button" aria-label="Trang trước" disabled={disabled || currentPage === 1 || total === 0} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        {total > 0 && pages.map((number, index) => (
          <span className="contents" key={number}>
            {index > 0 && number - pages[index - 1] > 1 && <span className="px-1 text-ink-soft" aria-hidden="true">…</span>}
            <button className={buttonClass} type="button" aria-label={`Trang ${number}`} aria-current={number === currentPage ? 'page' : undefined} disabled={disabled} onClick={() => number !== currentPage && onPageChange(number)}>
              {number}
            </button>
          </span>
        ))}
        <button className={buttonClass} type="button" aria-label="Trang sau" disabled={disabled || currentPage === totalPages || total === 0} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
