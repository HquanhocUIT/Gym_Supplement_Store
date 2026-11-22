# Dùng Node 22 đúng với phiên bản tối thiểu của backend.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Cài theo lockfile để các máy dùng cùng phiên bản dependency.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Tải CA công khai của Supabase và kiểm tra đúng nội dung trước khi đóng gói.
RUN wget -q -O /app/supabase-root.crt https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt \
    && echo "700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7  /app/supabase-root.crt" | sha256sum -c - \
    && chmod 0444 /app/supabase-root.crt

# Chỉ copy mã nguồn; .env và chứng chỉ bị loại trong .dockerignore.
COPY --chown=node:node src ./src

# Chạy API bằng user không có quyền root.
USER node
EXPOSE 5000

# Run the API through the package.json start script.
CMD ["npm", "start"]
