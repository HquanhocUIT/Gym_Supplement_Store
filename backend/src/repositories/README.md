# Repositories

Place SQL and database access here. Controllers handle HTTP, services implement
business rules, and repositories use the shared pool from `../config/db`.

Pass all input values separately using `$1`, `$2`, etc. Never concatenate user
input into SQL. Example for a future users repository, after the users schema exists:

```js
const pool = require('../config/db');

async function findById(id) {
  const result = await pool.query(
    'SELECT id, email, full_name, role FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] || null;
}
```

For transactions, acquire one client with `pool.connect()`, use that client for
every statement, and always release it in `finally`.

`/health` chỉ kiểm tra API còn chạy. Task 7 thêm `healthRepository.js` với truy vấn
chỉ đọc để `/health/db` và `/api/health/db` kiểm tra database thật. Schema và seed
SQL vẫn thuộc Tasks 14 và 15, sau khi chốt ERD.
