const { port } = require('./config/env');
const app = require('./app');
const pool = require('./config/db');

const server = app.listen(port, () => {
  console.log(`Server running on port ${server.address().port}`);
});

server.on('error', async (err) => {
  console.error(`HTTP server could not start (${err.code || 'UNKNOWN_ERROR'}).`);
  await pool.end();
  process.exitCode = 1;
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal}: closing HTTP server and PostgreSQL pool.`);

  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();

  server.close(async (err) => {
    try {
      await pool.end();
      process.exitCode = err ? 1 : 0;
    } catch {
      console.error('Failed to close the PostgreSQL pool.');
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
