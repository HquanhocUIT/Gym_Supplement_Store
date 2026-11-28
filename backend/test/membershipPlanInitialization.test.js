const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Client } = require('pg');
const { initializeMembershipPlans } = require('../src/repositories/membershipPlanInitialization');

test('membership initialization propagates database failures', async () => {
  const failure = new Error('Database unavailable');
  await assert.rejects(initializeMembershipPlans({ query: async () => { throw failure; } }), failure);
});

test('membership initialization preserves existing catalogs across restarts', {
  skip: !process.env.TEST_DATABASE_URL && 'requires TEST_DATABASE_URL',
}, async (t) => {
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  try {
    // All queries are confined to this session's temporary schema, never public.
    await client.query('SET search_path TO pg_temp');
    await client.query(`CREATE TEMP TABLE membership_plans (
      id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL,
      duration_days INTEGER NOT NULL, price NUMERIC(12,2) NOT NULL, status TEXT NOT NULL
    )`);

    await t.test('seeds an empty table once with the four configured plans', async () => {
      assert.equal(await initializeMembershipPlans(client), 4);
      assert.equal(await initializeMembershipPlans(client), 0);
      const { rows } = await client.query('SELECT name, duration_days, price, status FROM membership_plans ORDER BY duration_days');
      assert.deepEqual(rows, [
        { name: '1 Month Pass', duration_days: 30, price: '250000.00', status: 'active' },
        { name: '3 Month Pass', duration_days: 90, price: '690000.00', status: 'active' },
        { name: '6 Month Pass', duration_days: 180, price: '1290000.00', status: 'active' },
        { name: '1 Year Pass', duration_days: 365, price: '2390000.00', status: 'active' },
      ]);
    });

    await t.test('does not overwrite edited prices or reactivate hidden plans', async () => {
      await client.query("UPDATE membership_plans SET status = 'hidden', price = 123456");
      const before = await client.query('SELECT * FROM membership_plans ORDER BY id');
      assert.equal(await initializeMembershipPlans(client), 0);
      const after = await client.query('SELECT * FROM membership_plans ORDER BY id');
      assert.deepEqual(after.rows, before.rows);
    });

    await t.test('does not insert defaults into a custom catalog', async () => {
      await client.query('TRUNCATE membership_plans');
      await client.query("INSERT INTO membership_plans(name, duration_days, price, status) VALUES ('Custom', 45, 100, 'active')");
      assert.equal(await initializeMembershipPlans(client), 0);
      assert.equal((await client.query('SELECT * FROM membership_plans')).rowCount, 1);
    });
  } finally {
    await client.end();
  }
});
