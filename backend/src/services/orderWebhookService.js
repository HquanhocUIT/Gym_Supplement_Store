const ORDER_WEBHOOK_TIMEOUT_MS = 5000;

function createOrderCreatedPayload({ customerEmail, order }) {
  return {
    event: 'order.created',
    customer_email: customerEmail,
    order: {
      id: order.id,
      status: order.status,
      recipient_name: order.recipient_name,
      total_amount: order.total_amount,
      payment_method: 'cod',
      items: (order.items || []).map((item) => ({
        product_name: item.product_name,
        variant_description: item.variant_description,
        quantity: item.quantity,
        price: item.price,
      })),
    },
  };
}

async function notifyOrderCreated({ customerEmail, order }) {
  const webhookUrl = process.env.N8N_ORDER_CREATED_WEBHOOK_URL?.trim();
  if (!webhookUrl) return false;

  const payload = createOrderCreatedPayload({ customerEmail, order });

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(ORDER_WEBHOOK_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`Order-created webhook returned HTTP ${response.status} for order ${order.id}.`);
      return false;
    }

    console.info(`Order-created webhook delivered for order ${order.id}.`);
    return true;
  } catch {
    console.warn(`Order-created webhook could not reach n8n for order ${order.id}.`);
    return false;
  }
}

module.exports = { createOrderCreatedPayload, notifyOrderCreated };
