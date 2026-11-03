// Khối giữ chỗ khi đang tải; tự tắt hiệu ứng nếu người dùng hạn chế chuyển động.
export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div aria-hidden="true" className={`rounded-lg bg-line motion-safe:animate-pulse ${className}`} />
}

// Mẫu loading cho thẻ sản phẩm, dùng lại ở cửa hàng và các trang liên quan.
export function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-card border border-line bg-white p-4">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}
