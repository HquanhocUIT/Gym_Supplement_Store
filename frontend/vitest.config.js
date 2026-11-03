import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Dùng DOM giả lập để kiểm tra tương tác component mà không cần mở trình duyệt.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
