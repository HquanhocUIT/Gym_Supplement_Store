const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

// Xác định đường dẫn tới file mô tả API trong backend/src/docs.
const filePath = path.resolve(__dirname, '../docs/openapi.yaml');

// Đọc YAML và chuyển thành object để Swagger UI sử dụng.
const fileContent = fs.readFileSync(filePath, 'utf8');
const swaggerDocument = YAML.parse(fileContent);

// Cho phép Swagger gọi API trên cùng máy chủ đang phục vụ trang /docs.
// Local dùng localhost; khi deploy sẽ tự dùng địa chỉ backend đã deploy.
swaggerDocument.servers = [{ url: '/' }];

module.exports = swaggerDocument;