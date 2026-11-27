const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');
const { corsOrigin } = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const healthController = require('./controllers/healthController');
const errorHandler = require('./middlewares/errorHandler');
const { loginLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.disable('x-powered-by');
// Production chạy sau proxy của Render nên cần tin cậy một lớp proxy để lấy IP thật.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
// Local dùng HTTP; khi chạy production vẫn giữ cơ chế nâng lên HTTPS.
const isDevelopment = app.get('env') === 'development';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'upgrade-insecure-requests': isDevelopment ? null : [],
      },
    },
  }),
);
app.use(cors({ origin: corsOrigin }));
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }));
app.use(express.json({ limit: '1mb' }));
// Cung cấp đặc tả JSON để tải tài liệu hoặc import trực tiếp vào Postman.
app.get('/openapi.json', (_req, res) => {
  res.json(swaggerDocument);
});
// Hiển thị tài liệu API công khai, có thể gửi request trực tiếp từ Swagger.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: { validatorUrl: null },
}));

app.get('/health', healthController.check);
// Hai dạng URL dùng chung controller để thuận tiện kiểm tra local và cấu hình deploy.
app.get('/health/db', healthController.checkDatabase);
// Chặn brute-force cho endpoint đăng nhập trước khi vào router.
app.use('/api/auth/login', loginLimiter);
app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

app.use(errorHandler);

module.exports = app;
