const path = require('node:path');

require('dotenv').config({
  path: [path.resolve(__dirname, '../../.env'), path.resolve(__dirname, '../../../.env')],
  quiet: true,
});

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer between 0 and 65535.');
}

module.exports = {
  port,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
