const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const orderWebhookService = require('../src/services/orderWebhookService');

const originalWebhookUrl = process.env.N8N_ORDER_CREATED_WEBHOOK_URL;

afterEach(() => {
  if (originalWebhookUrl === undefined) delete process.env.N8N_ORDER_CREATED_WEBHOOK_URL;
  else process.env.N8N_ORDER_CREATED_WEBHOOK_URL = originalWebhookUrl;
});

test('order-created payload includes the customer email and safe order details', () => {
  const payload = orderWebhookService.createOrderCreatedPayload({
    customerEmail: 'member@example.com',
    order: {
      id: 15,
      status: 'pending',
      recipient_name: 'Gym Member',
      recipient_phone: '0900000000',
      shipping_address: 'Private address',
      total_amount: '90.00',
      items: [{
        product_name: 'Daily Whey',
        variant_description: 'Vanilla · 1 kg',
        quantity: 2,
        price: '45.00',
      }],
    },
  });

  assert.deepEqual(payload, {
    event: 'order.created',
    customer_email: 'member@example.com',
    order: {
      id: 15,
      status: 'pending',
      recipient_name: 'Gym Member',
      total_amount: '90.00',
      payment_method: 'cod',
      items: [{
        product_name: 'Daily Whey',
        variant_description: 'Vanilla · 1 kg',
        quantity: 2,
        price: '45.00',
      }],
    },
  });
});

test('order-created notification posts the payload to the configured n8n URL', async (t) => {
  process.env.N8N_ORDER_CREATED_WEBHOOK_URL = 'https://example.app.n8n.cloud/webhook/gym-store/order-created';
  let requestDetails;
  t.mock.method(global, 'fetch', async (url, options) => {
    requestDetails = { url, options };
    return { ok: true, status: 200 };
  });
  t.mock.method(console, 'info', () => {});

  const delivered = await orderWebhookService.notifyOrderCreated({
    customerEmail: 'member@example.com',
    order: { id: 15, status: 'pending', recipient_name: 'Gym Member', total_amount: '90.00', items: [] },
  });

  assert.equal(delivered, true);
  assert.equal(requestDetails.url, process.env.N8N_ORDER_CREATED_WEBHOOK_URL);
  assert.equal(requestDetails.options.method, 'POST');
  assert.equal(requestDetails.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(requestDetails.options.body), {
    event: 'order.created',
    customer_email: 'member@example.com',
    order: {
      id: 15,
      status: 'pending',
      recipient_name: 'Gym Member',
      total_amount: '90.00',
      payment_method: 'cod',
      items: [],
    },
  });
});

test('order-created notification is skipped when no n8n URL is configured', async () => {
  delete process.env.N8N_ORDER_CREATED_WEBHOOK_URL;

  const delivered = await orderWebhookService.notifyOrderCreated({
    customerEmail: 'member@example.com',
    order: { id: 15, status: 'pending', total_amount: '90.00' },
  });

  assert.equal(delivered, false);
});

test('order-created notification failure does not throw or log the webhook URL', async (t) => {
  process.env.N8N_ORDER_CREATED_WEBHOOK_URL = 'https://example.app.n8n.cloud/webhook/private-token';
  const warnings = [];
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 503 }));
  t.mock.method(console, 'warn', (...args) => warnings.push(args.join(' ')));

  const delivered = await orderWebhookService.notifyOrderCreated({
    customerEmail: 'member@example.com',
    order: { id: 15, status: 'pending', total_amount: '90.00', items: [] },
  });

  assert.equal(delivered, false);
  assert.match(warnings[0], /HTTP 503/);
  assert.equal(warnings[0].includes('private-token'), false);
});
