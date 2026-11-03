import { useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ImageUploader from './ImageUploader.jsx'
import Pagination from './Pagination.jsx'

afterEach(cleanup)

// Giả lập URL ảnh vì DOM dùng trong test không tạo URL file như trình duyệt thật.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})

// Form nhỏ giữ file để kiểm tra component có điều khiển giống lúc dùng thực tế.
function ImageForm({ onChange = () => {} }) {
  const [image, setImage] = useState(null)
  return <ImageUploader value={image} onChange={(file) => { setImage(file); onChange(file) }} />
}

it('phân trang không cho đi lùi ở trang đầu và đi tiếp ở trang cuối', () => {
  const onPageChange = vi.fn()
  const { rerender } = render(<Pagination page={1} pageSize={4} total={12} onPageChange={onPageChange} />)
  expect(screen.getByRole('button', { name: 'Trang trước' }).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  expect(onPageChange).toHaveBeenCalledWith(2)

  rerender(<Pagination page={3} pageSize={4} total={12} onPageChange={onPageChange} />)
  expect(screen.getByRole('button', { name: 'Trang sau' }).disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Trang 3' }).getAttribute('aria-current')).toBe('page')
})

it('vô hiệu hóa phân trang khi danh sách rỗng', () => {
  render(<Pagination page={1} total={0} onPageChange={vi.fn()} />)
  expect(screen.getByText('0–0 / 0 kết quả')).toBeTruthy()
  expect(screen.getAllByRole('button').every((button) => button.disabled)).toBe(true)
})

it('không tạo hàng nghìn nút khi tổng số trang lớn', () => {
  render(<Pagination page={5000} pageSize={1} total={10000} onPageChange={vi.fn()} />)
  expect(screen.getAllByRole('button').length).toBeLessThanOrEqual(7)
})

it('chọn ảnh hợp lệ, xem trước rồi xóa và giải phóng URL', async () => {
  const onChange = vi.fn()
  render(<ImageForm onChange={onChange} />)
  const file = new File(['ảnh mẫu'], 'whey.png', { type: 'image/png' })

  fireEvent.change(screen.getByLabelText('Ảnh sản phẩm'), { target: { files: [file] } })
  expect(onChange).toHaveBeenCalledWith(file)
  await waitFor(() => expect(screen.getByAltText('Xem trước ảnh sản phẩm đã chọn').getAttribute('src')).toBe('blob:preview'))

  fireEvent.click(screen.getByRole('button', { name: 'Xóa ảnh' }))
  expect(onChange).toHaveBeenLastCalledWith(null)
  await waitFor(() => expect(screen.queryByRole('img')).toBeNull())
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
})

it('từ chối file sai định dạng và giữ lại ảnh hợp lệ trước đó', async () => {
  const onChange = vi.fn()
  render(<ImageForm onChange={onChange} />)
  const input = screen.getByLabelText('Ảnh sản phẩm')
  const image = new File(['ảnh'], 'whey.png', { type: 'image/png' })
  fireEvent.change(input, { target: { files: [image] } })

  fireEvent.change(input, { target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] } })
  expect(screen.getByRole('alert').textContent).toContain('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.')
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('img')).toBeTruthy()
})

it('từ chối ảnh rỗng và ảnh vượt dung lượng cho phép', () => {
  const onChange = vi.fn()
  render(<ImageUploader onChange={onChange} maxSizeMB={1} />)
  const input = screen.getByLabelText('Ảnh sản phẩm')

  fireEvent.change(input, { target: { files: [new File([], 'empty.png', { type: 'image/png' })] } })
  expect(screen.getByRole('alert').textContent).toContain('không quá 1 MB')

  const largeFile = new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
  fireEvent.change(input, { target: { files: [largeFile] } })
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole('alert').textContent).toContain('không quá 1 MB')
})

it('giải phóng URL khi rời trang', async () => {
  const file = new File(['ảnh'], 'whey.png', { type: 'image/png' })
  const { unmount } = render(<ImageUploader value={file} onChange={vi.fn()} />)
  await waitFor(() => expect(screen.getByRole('img')).toBeTruthy())
  unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
})
