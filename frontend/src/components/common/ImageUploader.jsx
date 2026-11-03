import { useEffect, useId, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

// value nhận File, URL ảnh có sẵn hoặc null; onChange trả File/null cho form cha.
export default function ImageUploader({ value = null, onChange, label = 'Ảnh sản phẩm', maxSizeMB = 5, disabled = false, error = '' }) {
  const inputId = useId()
  const previewRef = useRef(null)
  const [validationError, setValidationError] = useState('')
  const errorMessage = validationError || error

  // Tạo URL xem trước cho file local và thu hồi URL khi đổi ảnh hoặc rời trang.
  useEffect(() => {
    if (!value || typeof value === 'string') return

    const objectUrl = URL.createObjectURL(value)
    previewRef.current.src = objectUrl
    return () => URL.revokeObjectURL(objectUrl)
  }, [value])

  // Kiểm tra file trước khi trả cho form; chọn sai vẫn giữ lại ảnh hợp lệ trước đó.
  function handleChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!allowedTypes.includes(file.type)) {
      setValidationError('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.')
      return
    }
    if (file.size === 0 || file.size > maxSizeMB * 1024 * 1024) {
      setValidationError(`Ảnh phải có dung lượng lớn hơn 0 và không quá ${maxSizeMB} MB.`)
      return
    }

    setValidationError('')
    onChange(file)
  }

  function handleRemove() {
    setValidationError('')
    onChange(null)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-ink" htmlFor={inputId}>{label}</label>
      <input id={inputId} type="file" accept={allowedTypes.join(',')} disabled={disabled} onChange={handleChange} aria-invalid={Boolean(errorMessage)} aria-describedby={`${inputId}-hint${errorMessage ? ` ${inputId}-error` : ''}`} className="block w-full rounded-xl border border-line bg-white p-2 text-sm text-ink-soft file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:font-semibold file:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-not-allowed disabled:opacity-50" />
      <p className="text-sm leading-6 text-ink-soft" id={`${inputId}-hint`}>JPG, PNG hoặc WebP, tối đa {maxSizeMB} MB.</p>
      {errorMessage && <p className="text-sm text-red-700" role="alert" id={`${inputId}-error`}>{errorMessage}</p>}
      {value && (
        <div className="rounded-xl border border-line bg-paper p-3">
          <img ref={previewRef} src={typeof value === 'string' ? value : undefined} alt="Xem trước ảnh sản phẩm đã chọn" className="aspect-[4/3] w-full rounded-lg object-contain" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 break-all text-sm text-ink-soft">{typeof value === 'string' ? 'Ảnh hiện tại' : value?.name}</p>
            <button type="button" disabled={disabled} onClick={handleRemove} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Trash2 size={16} aria-hidden="true" /> Xóa ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
