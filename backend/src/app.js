const { corsOrigin } = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const healthController = require('./controllers/healthController');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(morgan('dev', { skip: () => process.env.NODE_ENV === 'test' }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', healthController.check);
// Hai dạng URL dùng chung controller để thuận tiện kiểm tra local và cấu hình deploy.
app.get('/health/db', healthController.checkDatabase);
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
