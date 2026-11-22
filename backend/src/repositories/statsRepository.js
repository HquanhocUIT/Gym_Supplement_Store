const pool = require('../config/db');

// Store ghi nhận doanh thu khi đơn COD giao thành công; Gym dùng payment hoàn tất.
exports.getRevenue = async () => {
  const result = await pool.query({
    text: `
      SELECT
        COALESCE((
          SELECT SUM(total_amount)
          FROM orders
          WHERE status = 'delivered'
            AND updated_at >= CURRENT_DATE
            AND updated_at < CURRENT_TIMESTAMP
        ), 0)::numeric AS store_today,
        COALESCE((
          SELECT SUM(amount)
          FROM payments
          WHERE membership_id IS NOT NULL
            AND status = 'completed'
            AND updated_at >= CURRENT_DATE
            AND updated_at < CURRENT_TIMESTAMP
        ), 0)::numeric AS gym_today,
        COALESCE((
          SELECT SUM(total_amount)
          FROM orders
          WHERE status = 'delivered'
            AND updated_at >= date_trunc('month', CURRENT_DATE)
            AND updated_at < CURRENT_TIMESTAMP
        ), 0)::numeric AS store_month,
        COALESCE((
          SELECT SUM(amount)
          FROM payments
          WHERE membership_id IS NOT NULL
            AND status = 'completed'
            AND updated_at >= date_trunc('month', CURRENT_DATE)
            AND updated_at < CURRENT_TIMESTAMP
        ), 0)::numeric AS gym_month
    `,
    query_timeout: 5000,
  });

  return result.rows[0];
};

// Đếm hội viên đang active và còn trong thời hạn gói tập.
exports.getActiveMemberCount = async () => {
  const result = await pool.query({
    text: `
      SELECT COUNT(DISTINCT user_id)::integer AS count
      FROM memberships
      WHERE status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
    `,
    query_timeout: 5000,
  });

  return result.rows[0].count;
};

// Liệt kê các gói thành viên sẽ hết hạn trong bảy ngày tới.
exports.getExpiringMemberships = async () => {
  const result = await pool.query({
    text: `
      SELECT m.id AS membership_id, u.id AS member_id, u.full_name, u.email,
        mp.id AS plan_id, mp.name AS plan_name, m.end_date,
        GREATEST(m.end_date - CURRENT_DATE, 0)::integer AS days_left
      FROM memberships AS m
      JOIN users AS u ON u.id = m.user_id
      JOIN membership_plans AS mp ON mp.id = m.plan_id
      WHERE m.status = 'active'
        AND m.start_date <= CURRENT_DATE
        AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
      ORDER BY m.end_date ASC, m.id ASC
    `,
    query_timeout: 5000,
  });

  return result.rows;
};

// Xếp hạng năm sản phẩm bán nhiều nhất, bỏ qua đơn đã hủy.
exports.getTopProducts = async () => {
  const result = await pool.query({
    text: `
      SELECT p.id AS product_id, p.name AS product_name,
        SUM(oi.quantity)::integer AS units_sold,
        COALESCE(SUM(oi.price * oi.quantity), 0)::numeric AS sales_amount
      FROM order_items AS oi
      JOIN orders AS o ON o.id = oi.order_id
      JOIN product_variants AS v ON v.id = oi.variant_id
      JOIN products AS p ON p.id = v.product_id
      WHERE o.status <> 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY units_sold DESC, p.name ASC
      LIMIT 5
    `,
    query_timeout: 5000,
  });

  return result.rows;
};

// Lấy các biến thể tồn kho thấp theo ngưỡng được service truyền vào.
exports.getLowStockVariants = async (threshold) => {
  const result = await pool.query({
    text: `
      SELECT v.id AS variant_id, p.id AS product_id, p.name AS product_name,
        v.flavor, v.size, v.stock
      FROM product_variants AS v
      JOIN products AS p ON p.id = v.product_id
      WHERE v.stock <= $1
      ORDER BY v.stock ASC, p.name ASC, v.id ASC
    `,
    values: [threshold],
    query_timeout: 5000,
  });

  return result.rows;
};
