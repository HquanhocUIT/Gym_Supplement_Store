# n8n order confirmation demo

After a COD order is committed, the backend can send an `order.created` event to an n8n Webhook. The event includes the account email and the order summary needed by the email node. A webhook delivery problem does not undo the saved order.

## Backend setting

Set `N8N_ORDER_CREATED_WEBHOOK_URL` on the backend service to the **Production URL** shown by the n8n Webhook node. Activate the n8n workflow before testing. Keep this setting out of the frontend and source control.

## n8n email node

Set **To Email** to this expression:

```text
{{$json.body.customer_email}}
```

The order fields are available under `$json.body.order`, including `id`, `status`, `recipient_name`, `total_amount`, `payment_method`, and `items`. For example, use `{{$json.body.order.id}}` in the subject and `{{$json.body.order.total_amount}}` in the message body.

The webhook request has this shape:

```json
{
  "event": "order.created",
  "customer_email": "member@example.com",
  "order": {
    "id": 15,
    "status": "pending",
    "recipient_name": "Gym Member",
    "total_amount": "90.00",
    "payment_method": "cod",
    "items": [
      {
        "product_name": "Daily Whey",
        "variant_description": "Vanilla · 1 kg",
        "quantity": 2,
        "price": "45.00"
      }
    ]
  }
}
```
