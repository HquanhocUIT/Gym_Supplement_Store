# Dùng Node 22 đúng với phiên bản tối thiểu của backend.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Cài theo lockfile để các máy dùng cùng phiên bản dependency.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Chỉ copy mã nguồn; .env và chứng chỉ bị loại trong .dockerignore.
COPY --chown=node:node src ./src

# Chạy API bằng user không có quyền root.
USER node
EXPOSE 5000

CMD ["node", "src/index.js"]
