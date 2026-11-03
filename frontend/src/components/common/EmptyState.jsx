import { PackageOpen } from 'lucide-react'

// Hiển thị lý do chưa có dữ liệu và hành động tiếp theo nếu trang có cung cấp.
export default function EmptyState({
  title = 'Chưa có dữ liệu',
  description,
  icon: Icon = PackageOpen,
  action,
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center" role="status">
      <span className="grid size-12 place-items-center rounded-2xl bg-paper text-ink-soft">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm leading-6 text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
