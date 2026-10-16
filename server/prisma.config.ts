import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // Dùng URL kết nối trực tiếp (port 5432) cho CLI migrate
    url: process.env.DIRECT_URL,
  },
})