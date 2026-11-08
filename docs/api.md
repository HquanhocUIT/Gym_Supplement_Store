# API Documentation - Auth, Gym, Store & Dashboard

> Phase 1 - Design (DB & API). Audience: Quân and Sang (reviewers).
> Base URL: `https://api.gymstore.local/v1`
> Auth: Bearer JWT in `Authorization: Bearer <token>` header unless marked Public.

## Conventions

| Item | Convention |
|------|------------|
| Method | HTTP method |
| URL | Endpoint path relative to base URL |
| Access | Who can call: Public / Authenticated / Member / Staff / Admin |
| Request | Main request body fields |
| Response | Main successful response body |
| Errors | Common HTTP error codes for this endpoint |

Role values: `admin`, `staff`, `member`.

---

## 1. Auth

| Method | URL | Access | Request (main fields) | Response (success) | Errors |
|--------|-----|--------|-----------------------|--------------------|--------|
| POST | `/auth/register` | Public | `email`, `password`, `full_name`, `role` | `user { id, email, full_name, role }`, `access_token`, `refresh_token` | 400, 409, 422, 500 |
| POST | `/auth/login` | Public | `email`, `password` | `access_token`, `refresh_token`, `user { ... }` | 400, 401, 422, 500 |
| POST | `/auth/logout` | Authenticated | — | `{ success: true }` | 401, 500 |
| POST | `/auth/refresh` | Public (refresh token) | `refresh_token` | `access_token`, `refresh_token` | 401, 422, 500 |
| GET | `/auth/me` | Authenticated | — | `user { id, email, full_name, role, created_at }` | 401, 404, 500 |
| PUT | `/auth/me` | Authenticated | `full_name`, `password` (optional) | `user { ... }` | 400, 401, 409, 422, 500 |
| POST | `/auth/forgot-password` | Public | `email` | `{ success: true }` | 400, 422, 500 |
| POST | `/auth/reset-password` | Public (reset token) | `token`, `password` | `{ success: true }` | 400, 401, 422, 500 |

### Auth error codes detail

| Code | Meaning |
|------|---------|
| 400 | Bad request (missing/invalid fields) |
| 401 | Unauthorized (invalid credentials, expired/missing token) |
| 403 | Forbidden (role not allowed) |
| 404 | Not found (user not found) |
| 409 | Conflict (email already registered) |
| 422 | Unprocessable entity (validation failed) |
| 500 | Internal server error |

---

## 2. Gym

| Method | URL | Access | Request (main fields) | Response (success) | Errors |
|--------|-----|--------|-----------------------|--------------------|--------|
| GET | `/gym/membership-plans` | Public | — | `plans [ { id, name, duration_days, price, status, created_at } ]` | 401, 500 |
| GET | `/gym/membership-plans/:id` | Public | — | `plan { id, name, duration_days, price, status, created_at }` | 404, 500 |
| POST | `/gym/membership-plans` | Staff / Admin | `name`, `duration_days`, `price`, `status` | `plan { ... }` | 400, 401, 403, 409, 422, 500 |
| PUT | `/gym/membership-plans/:id` | Staff / Admin | `name`, `duration_days`, `price`, `status` | `plan { ... }` | 400, 401, 403, 404, 409, 422, 500 |
| DELETE | `/gym/membership-plans/:id` | Admin | — | `{ success: true }` | 401, 403, 404, 500 |
| GET | `/gym/memberships` | Authenticated | — | `memberships [ { id, user, plan, start_date, end_date, status } ]` | 401, 500 |
| GET | `/gym/memberships/:id` | Authenticated | — | `membership { ... }` | 401, 403, 404, 500 |
| POST | `/gym/memberships` | Member / Staff / Admin | `plan_id`, `start_date`, `end_date` | `membership { ... }` | 400, 401, 403, 404, 409, 422, 500 |
| PUT | `/gym/memberships/:id` | Staff / Admin | `start_date`, `end_date`, `status` | `membership { ... }` | 400, 401, 403, 404, 422, 500 |
| DELETE | `/gym/memberships/:id` | Staff / Admin | — | `{ success: true }` | 401, 403, 404, 500 |
| GET | `/gym/checkins` | Authenticated | — | `checkins [ { id, user, checkin_time } ]` | 401, 500 |
| POST | `/gym/checkins` | Member / Staff / Admin | `user_id` | `checkin { id, user_id, checkin_time }` | 400, 401, 403, 404, 422, 500 |
| GET | `/gym/checkins/:id` | Authenticated | — | `checkin { ... }` | 401, 403, 404, 500 |
| GET | `/gym/members` | Staff / Admin | — | `users [ { id, email, full_name, role } ]` | 401, 403, 500 |
| GET | `/gym/members/:id` | Staff / Admin | — | `user { id, email, full_name, role, memberships }` | 401, 403, 404, 500 |

### Gym access rules

- **Public**: no authentication required (browsing plans).
- **Authenticated**: any logged-in user (admin, staff, member). A member can only see their own memberships/check-ins; staff/admin see all.
- **Member**: logged-in user with role `member` (may act on own records).
- **Staff**: logged-in user with role `staff` or `admin` (can manage plans, memberships, check-ins, members).
- **Admin**: logged-in user with role `admin` (can delete plans/memberships).

### Gym error codes detail

| Code | Meaning |
|------|---------|
| 400 | Bad request (missing/invalid fields) |
| 401 | Unauthorized (missing/expired token) |
| 403 | Forbidden (role not allowed or accessing another member's data) |
| 404 | Not found (plan/membership/checkin/user not found) |
| 409 | Conflict (duplicate plan name, overlapping active membership) |
| 422 | Unprocessable entity (validation: duration_days > 0, end_date >= start_date, price >= 0) |
| 500 | Internal server error |

---

## 3. Store

| Method | URL | Access | Request (main fields) | Response (success) | Errors |
|--------|-----|--------|-----------------------|--------------------|--------|
| GET | `/store/categories` | Public | — | `categories [ { id, name } ]` | 500 |
| GET | `/store/products` | Public | Query: `category_id`, `q`, `page`, `limit` (optional) | `items [ { id, name, description, image_url, category, variants } ]`, `page`, `limit`, `total` | 400, 500 |
| GET | `/store/products/:id` | Public | — | `product { id, name, description, image_url, category, variants }` | 404, 500 |
| POST | `/store/products` | Staff / Admin | `category_id`, `name`, `description`, `image_url` (optional) | `product { ... }` | 400, 401, 403, 404, 409, 422, 500 |
| PUT | `/store/products/:id` | Staff / Admin | `category_id`, `name`, `description`, `image_url` | `product { ... }` | 400, 401, 403, 404, 409, 422, 500 |
| POST | `/store/products/:id/variants` | Staff / Admin | `flavor` (optional), `size`, `price`, `stock` | `variant { id, flavor, size, price, stock }` | 400, 401, 403, 404, 422, 500 |
| PUT | `/store/variants/:id` | Staff / Admin | `flavor`, `size`, `price`, `stock` | `variant { ... }` | 400, 401, 403, 404, 422, 500 |
| GET | `/store/cart` | Authenticated | — | `cart { id, items [ { id, variant, quantity } ], subtotal }` | 401, 500 |
| POST | `/store/cart/items` | Authenticated | `variant_id`, `quantity` | `item { id, variant, quantity }` | 400, 401, 404, 409, 422, 500 |
| PUT | `/store/cart/items/:id` | Authenticated | `quantity` | `item { id, variant, quantity }` | 400, 401, 403, 404, 409, 422, 500 |
| DELETE | `/store/cart/items/:id` | Authenticated | — | `{ success: true }` | 401, 403, 404, 500 |
| POST | `/store/orders` | Authenticated | `recipient_name`, `recipient_phone`, `shipping_address`, `payment_method` | `order { id, items, subtotal, discount_amount, total_amount, status }`, `payment { id, amount, payment_method, status }` | 400, 401, 404, 409, 422, 500 |
| GET | `/store/orders` | Authenticated | Query: `page`, `limit` (optional) | `items [ { id, total_amount, status, created_at } ]`, `page`, `limit`, `total` | 401, 500 |
| GET | `/store/orders/:id` | Authenticated | — | `order { id, items, subtotal, discount_amount, total_amount, status }` | 401, 403, 404, 500 |
| PUT | `/store/orders/:id/status` | Staff / Admin | `status` | `order { id, status, updated_at }` | 400, 401, 403, 404, 409, 422, 500 |

### Store access and business rules

- Anyone can browse categories and products. A logged-in user can manage their own cart and view their own orders.
- Staff and admins can manage products and variants, view all orders, and update order status.
- The server checks stock and calculates prices, discounts, and totals during checkout. It creates the order and payment in one transaction.
- Order status values: `pending`, `confirmed`, `shipping`, `delivered`, `cancelled`.
- Payment methods: `cod`, `bank_transfer`. Payment status values: `pending`, `completed`.
- Cart and order quantities must be greater than zero. Variant price and stock cannot be negative.

### Store error codes detail

| Code | Meaning |
|------|---------|
| 400 | Bad request (missing or invalid fields) |
| 401 | Unauthorized (missing or expired token) |
| 403 | Forbidden (role not allowed or accessing another user's data) |
| 404 | Not found (category, product, variant, cart item, or order not found) |
| 409 | Conflict (not enough stock or order cannot change to that status) |
| 422 | Unprocessable entity (validation failed) |
| 500 | Internal server error |

---

## 4. Dashboard

| Method | URL | Access | Request (main fields) | Response (success) | Errors |
|--------|-----|--------|-----------------------|--------------------|--------|
| GET | `/dashboard/summary` | Staff / Admin | Query: `from`, `to` (optional) | `net_sales`, `order_count`, `product_count`, `customer_count`, `low_stock_count` | 400, 401, 403, 500 |
| GET | `/dashboard/recent-orders` | Staff / Admin | Query: `limit` (optional) | `orders [ { id, customer, item_summary, status, total_amount, created_at } ]` | 400, 401, 403, 500 |
| GET | `/dashboard/inventory` | Staff / Admin | Query: `limit` (optional) | `items [ { variant_id, product_name, flavor, size, stock } ]` | 400, 401, 403, 500 |

Dashboard data is for the admin store overview: sales, orders, products, customers, recent orders, and inventory. The low-stock threshold must be agreed and defined during implementation before returning `low_stock_count`.

---

## 5. Example payloads

### Register (Admin)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "admin@gym.local",
  "password": "Admin@123456",
  "full_name": "System Administrator",
  "role": "admin"
}
```

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "user": { "id": 1, "email": "admin@gym.local", "full_name": "System Administrator", "role": "admin" },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

### Create membership plan (Staff)
```http
POST /gym/membership-plans
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "3 Month Pass",
  "duration_days": 90,
  "price": 690000,
  "status": "active"
}
```

### Purchase membership (Member)
```http
POST /gym/memberships
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_id": 2,
  "start_date": "2026-11-01",
  "end_date": "2027-01-31"
}
```

### Check in (Member)
```http
POST /gym/checkins
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 3
}
```

### Add an item to the cart (Member)
```http
POST /store/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "variant_id": 1,
  "quantity": 2
}
```

### Create an order from the cart (Member)
```http
POST /store/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_name": "Alex Nguyen",
  "recipient_phone": "0900000000",
  "shipping_address": "District 1, Ho Chi Minh City",
  "payment_method": "cod"
}
```

### Get dashboard summary (Staff)
```http
GET /dashboard/summary?from=2026-11-01&to=2026-11-30
Authorization: Bearer <token>
```

---

> Auth and Gym endpoints are documented in Task 16. Store and Dashboard endpoints are a design proposal for review before implementation.
