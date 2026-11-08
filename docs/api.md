# API Documentation - Auth & Gym

> Phase 1 - Design (DB & API). Audience: Quân (reviewer).
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

## 3. Example payloads

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

---

> Reviewer: Quân. Pending approval before frontend/backend implementation.
