const pool = require('../config/db');

// Tạo lỗi ở repository cho các tình huống nghiệp vụ cần trả về cho client.
function createRepositoryError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

// Giữ các truy vấn thay đổi giỏ trong cùng một transaction.
async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Giữ lỗi ban đầu nếu kết nối không còn nhận được lệnh rollback.
    }
    throw error;
  } finally {
    client.release();
  }
}

// Tạo giỏ nếu chưa có và trả ID giỏ của đúng người dùng.
async function getOrCreateCartId(client, userId) {
  const result = await client.query({
    text: `
      INSERT INTO carts (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      RETURNING id
    `,
    values: [userId],
    query_timeout: 5000,
  });

  if (result.rows[0]) return result.rows[0].id;

  const existingCart = await client.query({
    text: 'SELECT id FROM carts WHERE user_id = $1',
    values: [userId],
    query_timeout: 5000,
  });

  return existingCart.rows[0].id;
}

// Tìm một sản phẩm đã chọn trong giỏ và trả đủ dữ liệu để giao diện hiển thị.
async function getCartItem(client, cartItemId) {
  const result = await client.query({
    text: `
      SELECT
        ci.id,
        ci.quantity,
        json_build_object(
          'id', v.id,
          'product_id', p.id,
          'product_name', p.name,
          'image_url', p.image_url,
          'flavor', v.flavor,
          'size', v.size,
          'price', v.price,
          'stock', v.stock
        ) AS variant
      FROM cart_items AS ci
      JOIN product_variants AS v ON v.id = ci.variant_id
      JOIN products AS p ON p.id = v.product_id
      WHERE ci.id = $1
    `,
    values: [cartItemId],
    query_timeout: 5000,
  });

  return result.rows[0] || null;
}

// Lấy giỏ hiện tại, tổng tiền và thông tin phiên bản của từng món.
exports.getCartByUserId = async (userId) => {
  const client = await pool.connect();

  try {
    const cartId = await getOrCreateCartId(client, userId);
    const result = await client.query({
      text: `
        SELECT
          c.id,
          COALESCE(
            json_agg(
              json_build_object(
                'id', ci.id,
                'quantity', ci.quantity,
                'variant', json_build_object(
                  'id', v.id,
                  'product_id', p.id,
                  'product_name', p.name,
                  'image_url', p.image_url,
                  'flavor', v.flavor,
                  'size', v.size,
                  'price', v.price,
                  'stock', v.stock
                )
              ) ORDER BY ci.id
            ) FILTER (WHERE ci.id IS NOT NULL),
            '[]'::json
          ) AS items,
          COALESCE(SUM(v.price * ci.quantity), 0) AS subtotal
        FROM carts AS c
        LEFT JOIN cart_items AS ci ON ci.cart_id = c.id
        LEFT JOIN product_variants AS v ON v.id = ci.variant_id
        LEFT JOIN products AS p ON p.id = v.product_id
        WHERE c.id = $1
        GROUP BY c.id
      `,
      values: [cartId],
      query_timeout: 5000,
    });

    return result.rows[0];
  } finally {
    client.release();
  }
};

// Thêm món vào giỏ hoặc cộng số lượng, đồng thời khóa variant để kiểm tra kho an toàn.
exports.addCartItem = async (userId, variantId, quantity) => withTransaction(async (client) => {
  const cartId = await getOrCreateCartId(client, userId);
  // Khóa giỏ trước để các thao tác thêm, sửa, xóa dùng cùng thứ tự khóa.
  await client.query({
    text: 'SELECT id FROM carts WHERE id = $1 FOR UPDATE',
    values: [cartId],
    query_timeout: 5000,
  });

  const variantResult = await client.query({
    text: 'SELECT id, stock FROM product_variants WHERE id = $1 FOR UPDATE',
    values: [variantId],
    query_timeout: 5000,
  });
  const variant = variantResult.rows[0];

  if (!variant) {
    throw createRepositoryError(404, 'VARIANT_NOT_FOUND', 'Không tìm thấy phiên bản sản phẩm.');
  }

  const itemResult = await client.query({
    text: 'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND variant_id = $2 FOR UPDATE',
    values: [cartId, variantId],
    query_timeout: 5000,
  });
  const existingItem = itemResult.rows[0];
  const nextQuantity = Number(existingItem?.quantity || 0) + quantity;

  if (nextQuantity > variant.stock) {
    throw createRepositoryError(
      409,
      'INSUFFICIENT_STOCK',
      `Tồn kho hiện tại là ${variant.stock}; không thể thêm số lượng này.`,
    );
  }

  const savedItem = existingItem
    ? await client.query({
      text: `
        UPDATE cart_items
        SET quantity = $1, updated_at = now()
        WHERE id = $2
        RETURNING id
      `,
      values: [nextQuantity, existingItem.id],
      query_timeout: 5000,
    })
    : await client.query({
      text: `
        INSERT INTO cart_items (cart_id, variant_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      values: [cartId, variantId, quantity],
      query_timeout: 5000,
    });

  await client.query({
    text: 'UPDATE carts SET updated_at = now() WHERE id = $1',
    values: [cartId],
    query_timeout: 5000,
  });

  return getCartItem(client, savedItem.rows[0].id);
});

// Đổi số lượng món thuộc giỏ của người dùng và kiểm tra lại tồn kho.
exports.updateCartItem = async (userId, cartItemId, quantity) => withTransaction(async (client) => {
  // Lấy variant trước để giữ cùng thứ tự khóa với thao tác thêm món.
  const itemLookup = await client.query({
    text: `
      SELECT ci.variant_id, ci.cart_id
      FROM cart_items AS ci
      JOIN carts AS c ON c.id = ci.cart_id
      WHERE ci.id = $1 AND c.user_id = $2
    `,
    values: [cartItemId, userId],
    query_timeout: 5000,
  });

  if (!itemLookup.rows[0]) {
    throw createRepositoryError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy món trong giỏ hàng.');
  }

  // Khóa giỏ trước variant và cart item để tránh deadlock với thêm/xóa món.
  const cartLock = await client.query({
    text: 'SELECT id FROM carts WHERE id = $1 AND user_id = $2 FOR UPDATE',
    values: [itemLookup.rows[0].cart_id, userId],
    query_timeout: 5000,
  });

  if (!cartLock.rows[0]) {
    throw createRepositoryError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy món trong giỏ hàng.');
  }

  const variantResult = await client.query({
    text: 'SELECT id, stock FROM product_variants WHERE id = $1 FOR UPDATE',
    values: [itemLookup.rows[0].variant_id],
    query_timeout: 5000,
  });
  const variant = variantResult.rows[0];

  if (quantity > variant.stock) {
    throw createRepositoryError(
      409,
      'INSUFFICIENT_STOCK',
      `Tồn kho hiện tại là ${variant.stock}; vui lòng giảm số lượng.`,
    );
  }

  const itemResult = await client.query({
    text: `
      SELECT ci.id
      FROM cart_items AS ci
      WHERE ci.id = $1 AND ci.cart_id = $2
      FOR UPDATE
    `,
    values: [cartItemId, itemLookup.rows[0].cart_id],
    query_timeout: 5000,
  });

  if (!itemResult.rows[0]) {
    throw createRepositoryError(404, 'CART_ITEM_NOT_FOUND', 'Không tìm thấy món trong giỏ hàng.');
  }

  await client.query({
    text: 'UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2',
    values: [quantity, cartItemId],
    query_timeout: 5000,
  });
  await client.query({
    text: 'UPDATE carts SET updated_at = now() WHERE id = $1',
    values: [itemLookup.rows[0].cart_id],
    query_timeout: 5000,
  });

  return getCartItem(client, cartItemId);
});

// Chỉ xóa món nếu nó thuộc về giỏ của người đang đăng nhập.
exports.deleteCartItem = async (userId, cartItemId) => withTransaction(async (client) => {
  const itemLookup = await client.query({
    text: `
      SELECT ci.cart_id
      FROM cart_items AS ci
      JOIN carts AS c ON c.id = ci.cart_id
      WHERE ci.id = $1 AND c.user_id = $2
    `,
    values: [cartItemId, userId],
    query_timeout: 5000,
  });

  if (!itemLookup.rows[0]) return null;

  const cartLock = await client.query({
    text: 'SELECT id FROM carts WHERE id = $1 AND user_id = $2 FOR UPDATE',
    values: [itemLookup.rows[0].cart_id, userId],
    query_timeout: 5000,
  });

  if (!cartLock.rows[0]) return null;

  const result = await client.query({
    text: `
      DELETE FROM cart_items AS ci
      WHERE ci.id = $1 AND ci.cart_id = $2
      RETURNING ci.id, ci.variant_id, ci.cart_id
    `,
    values: [cartItemId, itemLookup.rows[0].cart_id],
    query_timeout: 5000,
  });
  const deletedItem = result.rows[0];

  if (deletedItem) {
    await client.query({
      text: 'UPDATE carts SET updated_at = now() WHERE id = $1',
      values: [deletedItem.cart_id],
      query_timeout: 5000,
    });
  }

  if (deletedItem) {
    delete deletedItem.cart_id;
  }

  return deletedItem || null;
});
