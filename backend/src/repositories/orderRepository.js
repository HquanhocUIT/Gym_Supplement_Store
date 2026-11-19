const pool = require('../config/db');

// Gắn HTTP status và mã lỗi để middleware trả lỗi nghiệp vụ cho client.
function createRepositoryError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// Tạo đơn trong một transaction để tồn kho, đơn hàng và thanh toán luôn đồng bộ.
exports.createCodOrder = async (userId, shipping) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Khóa giỏ trước để không bị sửa trong lúc đang checkout.
    const cartResult = await client.query({
      text: 'SELECT id FROM carts WHERE user_id = $1 FOR UPDATE',
      values: [userId],
      query_timeout: 5000,
    });
    const cartId = cartResult.rows[0]?.id;

    if (!cartId) {
      throw createRepositoryError(409, 'CART_EMPTY', 'Giỏ hàng đang trống.');
    }

    // Khóa variant theo ID tăng dần để các checkout dùng cùng thứ tự khóa.
    const itemResult = await client.query({
      text: `
        SELECT
          ci.id AS cart_item_id,
          ci.variant_id,
          ci.quantity,
          v.price,
          v.stock,
          v.flavor,
          v.size,
          p.name AS product_name
        FROM cart_items AS ci
        JOIN product_variants AS v ON v.id = ci.variant_id
        JOIN products AS p ON p.id = v.product_id
        WHERE ci.cart_id = $1
        ORDER BY v.id
        FOR UPDATE OF v, ci
      `,
      values: [cartId],
      query_timeout: 5000,
    });
    const items = itemResult.rows;

    if (items.length === 0) {
      throw createRepositoryError(409, 'CART_EMPTY', 'Giỏ hàng đang trống.');
    }

    // Kiểm tra toàn bộ tồn kho trước khi ghi đơn hoặc trừ bất kỳ số lượng nào.
    const unavailableItem = items.find((item) => Number(item.quantity) > Number(item.stock));

    if (unavailableItem) {
      throw createRepositoryError(
        409,
        'INSUFFICIENT_STOCK',
        `${unavailableItem.product_name} hiện chỉ còn ${unavailableItem.stock} sản phẩm.`,
      );
    }

    // Tính subtotal trong PostgreSQL sau khi các variant đã được khóa.
    const subtotalResult = await client.query({
      text: `
        SELECT COALESCE(SUM(v.price * ci.quantity), 0)::numeric AS subtotal
        FROM cart_items AS ci
        JOIN product_variants AS v ON v.id = ci.variant_id
        WHERE ci.cart_id = $1
      `,
      values: [cartId],
      query_timeout: 5000,
    });

    // Chỉ áp dụng giảm giá khi user có membership active và còn trong ngày hiệu lực.
    const membershipResult = await client.query({
      text: `
        SELECT id
        FROM memberships
        WHERE user_id = $1
          AND status = 'active'
          AND start_date <= CURRENT_DATE
          AND end_date >= CURRENT_DATE
        ORDER BY end_date DESC, id DESC
        LIMIT 1
        FOR SHARE
      `,
      values: [userId],
      query_timeout: 5000,
    });

    // Dùng numeric của PostgreSQL để tính tiền và làm tròn giảm giá đến 2 chữ số.
    const totalResult = await client.query({
      text: `
        SELECT
          $1::numeric AS subtotal,
          CASE WHEN $2 THEN ROUND($1::numeric * 0.10, 2) ELSE 0::numeric END AS discount_amount,
          $1::numeric - CASE WHEN $2 THEN ROUND($1::numeric * 0.10, 2) ELSE 0::numeric END AS total_amount
      `,
      values: [subtotalResult.rows[0].subtotal, membershipResult.rows.length > 0],
      query_timeout: 5000,
    });
    const totals = totalResult.rows[0];

    const orderResult = await client.query({
      text: `
        INSERT INTO orders (
          user_id, recipient_name, recipient_phone, shipping_address,
          subtotal, discount_amount, total_amount, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING id, user_id, recipient_name, recipient_phone, shipping_address,
          subtotal, discount_amount, total_amount, status, created_at
      `,
      values: [
        userId,
        shipping.recipientName,
        shipping.recipientPhone,
        shipping.shippingAddress,
        totals.subtotal,
        totals.discount_amount,
        totals.total_amount,
      ],
      query_timeout: 5000,
    });
    const order = orderResult.rows[0];
    const orderItems = [];

    // Lưu snapshot sản phẩm rồi trừ kho trong cùng transaction.
    for (const item of items) {
      const variantDescription = [item.flavor, item.size].filter(Boolean).join(' · ') || item.size;
      const orderItemResult = await client.query({
        text: `
          INSERT INTO order_items (order_id, variant_id, product_name, variant_description, price, quantity)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, variant_id, product_name, variant_description, price, quantity
        `,
        values: [order.id, item.variant_id, item.product_name, variantDescription, item.price, item.quantity],
        query_timeout: 5000,
      });
      orderItems.push(orderItemResult.rows[0]);

      const stockResult = await client.query({
        text: `
          UPDATE product_variants
          SET stock = stock - $1, updated_at = now()
          WHERE id = $2 AND stock >= $1
          RETURNING id, stock
        `,
        values: [item.quantity, item.variant_id],
        query_timeout: 5000,
      });

      if (!stockResult.rows[0]) {
        throw createRepositoryError(409, 'INSUFFICIENT_STOCK', `${item.product_name} không còn đủ hàng.`);
      }
    }

    const paymentResult = await client.query({
      text: `
        INSERT INTO payments (user_id, order_id, amount, payment_method, status)
        VALUES ($1, $2, $3, 'cod', 'pending')
        RETURNING id, user_id, order_id, amount, payment_method, status, created_at
      `,
      values: [userId, order.id, totals.total_amount],
      query_timeout: 5000,
    });

    // Dọn giỏ chỉ sau khi đơn và payment đã tạo thành công.
    await client.query({
      text: 'DELETE FROM cart_items WHERE cart_id = $1',
      values: [cartId],
      query_timeout: 5000,
    });
    await client.query({
      text: 'UPDATE carts SET updated_at = now() WHERE id = $1',
      values: [cartId],
      query_timeout: 5000,
    });

    await client.query('COMMIT');

    return { order: { ...order, items: orderItems }, payment: paymentResult.rows[0] };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Trả lỗi ban đầu kể cả khi kết nối không còn nhận được lệnh rollback.
    }
    throw error;
  } finally {
    client.release();
  }
};
