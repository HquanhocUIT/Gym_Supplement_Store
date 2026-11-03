const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { setTimeout: wait } = require('node:timers/promises');

const backendDir = process.argv[2];

// Chỉ nhận hai tên thư mục đã biết, tránh chạy nhầm đường dẫn khác.
if (!['server', 'backend'].includes(backendDir)) {
  console.error('Dùng: node ci/smoke-health.cjs server|backend');
  process.exit(1);
}

// Chọn cổng trống để không đụng backend hoặc Docker đang chạy trên máy.
function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function main() {
  const port = await getFreePort();
  const folder = path.resolve(process.cwd(), backendDir);

  // Health API không cần database; không kết nối Supabase khi chạy CI.
  const server = spawn(process.execPath, [path.join(folder, 'src/index.js')], {
    cwd: folder,
    stdio: 'ignore',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      DATABASE_URL: '',
      DATABASE_SSL: 'false',
      DATABASE_SSL_CA_PATH: '',
      PGHOST: '127.0.0.1',
      PGPORT: '1',
    },
  });

  let spawnFailed = false;
  server.on('error', () => { spawnFailed = true; });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (spawnFailed || server.exitCode !== null) throw new Error('Backend dừng trước khi health sẵn sàng.');

      let response;
      try {
        response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      } catch {
        await wait(250);
        continue;
      }

      // Bản server cũ chỉ có /api/health; backend mới phải có /health.
      let route = '/health';
      if (backendDir === 'server' && response.status === 404) {
        route = '/api/health';
        response = await fetch(`${baseUrl}${route}`, { signal: AbortSignal.timeout(1000) });
      }
      if (!response.ok) throw new Error(`Health trả HTTP ${response.status}.`);

      const body = await response.json();
      if (body.success !== true || body.data?.status !== 'ok') throw new Error('Health trả dữ liệu không hợp lệ.');
      console.log(`${backendDir}: ${route} trả HTTP 200 và status ok.`);
      return;
    }
    throw new Error('Backend không sẵn sàng trong thời gian chờ.');
  } finally {
    // Chỉ dừng tiến trình Node do script này vừa khởi động.
    if (server.exitCode === null) server.kill();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
