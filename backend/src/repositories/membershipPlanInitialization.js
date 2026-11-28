// Only bootstrap a completely empty catalog. Hidden or customized plans belong
// to the administrator and must never be recreated or overwritten on restart.
async function initializeMembershipPlans(db) {
  const result = await db.query({
    text: `
      INSERT INTO membership_plans (name, duration_days, price, status)
      SELECT defaults.name, defaults.duration_days, defaults.price, 'active'
      FROM (VALUES
        ('1 Month Pass', 30, 250000),
        ('3 Month Pass', 90, 690000),
        ('6 Month Pass', 180, 1290000),
        ('1 Year Pass', 365, 2390000)
      ) AS defaults(name, duration_days, price)
      WHERE NOT EXISTS (SELECT 1 FROM membership_plans)
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `,
    query_timeout: 10000,
  });
  return result.rowCount;
}

module.exports = { initializeMembershipPlans };
