# Gym & Supplement Store Management System

A full-stack **gym management and supplement e-commerce** platform for managing memberships, gym check-ins, supplement products, carts, and orders in one place. The system combines a membership management back office with a public online store, giving gym owners a single dashboard for both recurring memberships and product sales.

**Course:** MSIS207.R11.CTTT — **Group 28**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)

---

## Table of Contents

- [Introduction](#introduction)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started (Local)](#getting-started-local)
- [Demo Accounts](#demo-accounts)
- [Live URLs](#live-urls)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Team](#team)

---

## Introduction

**Gym & Supplement Store Management System** is a monorepo web application built for a fitness business that sells gym memberships and sports supplements. It serves three roles:

- **Admin** — manages membership plans, members, products, categories, inventory, and business statistics.
- **Staff** — looks up members, renews memberships, and records gym check-ins.
- **Member** — views their membership, check-in history, and shops for supplements online.

The backend exposes a documented REST API, while the frontend provides a responsive React interface for the public store, the member portal, and the admin dashboard.

---

## Key Features

### Gym Management

- JWT authentication with role-based access control (`admin`, `staff`, `member`).
- Membership plan management (create, update, soft delete, public pricing).
- Member directory with search and membership status.
- Membership renewal and expiry tracking.
- Gym check-in recording and daily check-in list.
- Member self-service endpoints for profile, memberships, and check-in history.

### Supplement Store

- Product categories and products with multiple variants (size, flavor, price, stock).
- Product image upload backed by Supabase Storage.
- Product search, filtering, sorting, and pagination.
- Shopping cart for authenticated users.
- Cash-on-delivery checkout with stock deduction and membership discount.
- Public storefront with product detail pages.

### Dashboard & UX

- Admin dashboard with revenue, active members, expiring memberships, and low-stock alerts.
- Responsive layouts for mobile, tablet, and desktop.
- Loading skeletons, empty states, and toast notifications.
- Consistent `{ success, data, error }` API response contract.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios, TanStack Query, React Hook Form, Zod, Recharts, Lucide React, React Hot Toast |
| **Backend** | Node.js 22+, Express 5, `pg` (node-postgres), JSON Web Token, bcryptjs, Helmet, express-rate-limit, Multer, Swagger UI Express |
| **Database** | PostgreSQL 18 (Supabase in the cloud, or local PostgreSQL / Docker) |
| **Storage** | Supabase Storage (product images) |
| **DevOps** | GitHub Actions, Docker, Vercel (frontend), Render (backend) |
| **Documentation** | OpenAPI 3 / Swagger UI, Postman collection, DBML ERD |

---

## Architecture

This repository is a **monorepo** with three main workspaces:

```text
Gym-Supplement-Store/
├── frontend/          React + Vite single-page application
├── backend/           Express REST API
├── database/          PostgreSQL schema and seed scripts
├── docs/              API docs, ERD, Postman collection, screenshots
├── ci/                CI helper scripts
├── docker-compose.yml Local API + PostgreSQL stack
├── render.yaml        Render deployment blueprint
└── README.md
```

### Request Flow

```text
React (Vite)
   │  Axios + JWT
   ▼
Express routes
   ▼
Controllers  →  Services  →  Repositories  →  PostgreSQL (pg Pool)
```

- **Routes** define URLs, HTTP methods, and role guards.
- **Controllers** validate input and shape HTTP responses.
- **Services** hold business rules such as checkout and membership eligibility.
- **Repositories** contain parameterized SQL and are the only layer that talks to the database.
- **Middlewares** handle JWT authentication, authorization, rate limiting, uploads, and errors.

The frontend is a static SPA that talks to the backend through `VITE_API_URL`. The backend is stateless and can run on Render, Docker, or any Node.js host.

---

## Getting Started (Local)

### Prerequisites

- **Node.js 22 or newer** and npm
- **PostgreSQL 18** (local, Docker, or a Supabase project)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/LingSeanCoder/Gym-Supplement-Store.git
cd Gym-Supplement-Store
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (from the repository root)
cd ../frontend
npm install
```

### 3. Create environment files

Copy the example files and fill in your own values. **Never commit real secrets.**

```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

#### Backend `.env`

```dotenv
PORT=5000
CORS_ORIGIN=http://localhost:5173

# Supabase connection (recommended for cloud)
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres
DATABASE_SSL=true
DATABASE_SSL_CA_PATH=

# Local PostgreSQL alternative: leave DATABASE_URL empty and use PG* variables
PGHOST=localhost
PGPORT=5432
PGDATABASE=gym_supplement_store
PGUSER=postgres
PGPASSWORD=

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

# Supabase Storage (product images)
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=product-images
```

> **Important:** Do not add `sslmode`, `ssl`, or other SSL parameters to `DATABASE_URL`. SSL is controlled by `DATABASE_SSL` and `DATABASE_SSL_CA_PATH` so the backend can validate certificates correctly.

#### Frontend `.env`

```dotenv
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the SQL schema and seed data

The project uses plain SQL scripts in `database/` — there is no separate migration framework.

Run the files **in this order** in the **Supabase SQL Editor** (or with `psql`):

| Order | File | Purpose |
| --- | --- | --- |
| 1 | `database/schema/01_auth_gym.sql` | Users, membership plans, memberships, check-ins |
| 2 | `database/schema/02_store.sql` | Categories, products, variants, cart, orders, payments |
| 3 | `database/seed/01_gym_auth.sql` | Demo accounts, membership plans, memberships, check-ins |
| 4 | `database/seed/02_store.sql` | Demo categories, products, and variants |

The seed scripts are idempotent and safe to re-run. With `psql`:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/postgres" -f database/schema/01_auth_gym.sql
psql "postgresql://USER:PASSWORD@HOST:5432/postgres" -f database/schema/02_store.sql
psql "postgresql://USER:PASSWORD@HOST:5432/postgres" -f database/seed/01_gym_auth.sql
psql "postgresql://USER:PASSWORD@HOST:5432/postgres" -f database/seed/02_store.sql
```

Verify the connection after seeding:

```bash
curl http://localhost:5000/health/db
```

Expected: HTTP `200` with `"database": "connected"`.

### 5. Start the backend

```bash
cd backend
npm run dev
```

The API runs at **http://localhost:5000**. Liveness check:

```bash
curl http://localhost:5000/health
```

### 6. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

The app runs at **http://localhost:5173**.

### Optional: Docker Compose

To run the API and a local PostgreSQL database together:

```bash
docker compose up --build -d
docker compose ps
```

- API: `http://localhost:5000`
- PostgreSQL: `localhost:5433` (host port, configurable via `DOCKER_DB_PORT`)

Docker Compose mounts `database/schema/` into PostgreSQL's initialization directory, so the schema runs automatically on a **fresh** database volume. Run the seed files manually afterward with pgAdmin or `psql` if you need demo data. See `docs/decisions.md` and the comments in `docker-compose.yml` for details.

---

## Demo Accounts

Deployment does not create these accounts automatically. For the first production administrator, follow [Production accounts](docs/production-accounts.md) and choose your own password.

The seed file `database/seed/01_gym_auth.sql` creates the following accounts:

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@gym.local` | `Admin@123456` |
| **Staff** | `staff@gym.local` | `Staff@123456` |
| **Member** | `member@gym.local` | `Member@123456` |

Additional demo members (`alice.nguyen@gmail.com`, `bob.tran@gmail.com`, etc.) use the password `Member@123456`.

> These credentials are for local development and demonstrations only. Change or remove them before exposing the system to real users.

---

## Live URLs

**Frontend URL:** _To be added after deployment_

**Backend URL:** _To be added after deployment_

---

## API Documentation

Interactive API documentation is available through **Swagger UI**:

- **Swagger UI:** `http://localhost:5000/docs/`
- **OpenAPI JSON:** `http://localhost:5000/openapi.json`
- **Render Swagger UI:** `https://<render-service>.onrender.com/docs/` (replace with the backend URL shown in the Render Dashboard)
- **Render OpenAPI JSON:** `https://<render-service>.onrender.com/openapi.json`
- **OpenAPI source:** `backend/src/docs/openapi.yaml`
- **Endpoint reference:** `docs/api.md`
- **Postman collection:** `docs/postman/gym-supplement-store.postman_collection.json`

The Render Blueprint deploys the backend API and its docs from the same service; no separate static site is needed. See [the API guide](docs/api.md) for required Render settings and a checkout endpoint walkthrough.

### Authentication in Swagger

1. Call `POST /api/auth/login` with a demo account.
2. Copy `data.access_token` from the response.
3. Click **Authorize** in Swagger UI and paste the token.
4. Protected endpoints now include the `Bearer` token automatically.

### Main Endpoint Groups

| Group | Base Path | Access |
| --- | --- | --- |
| Health | `/health`, `/api/health` | Public |
| Auth | `/api/auth` | Public |
| Membership plans | `/api/plans` | Public read, Admin write |
| Members | `/api/members` | Admin / Staff |
| Check-ins | `/api/checkins` | Admin / Staff |
| Current user | `/api/me` | Authenticated |
| Categories | `/api/store/categories` | Public read, Admin write |
| Products | `/api/store/products` | Public read, Admin write |
| Cart | `/api/store/cart` | Authenticated |
| Orders | `/api/store/orders` | Authenticated |
| Dashboard stats | `/api/admin/stats` | Admin / Staff |

All responses follow the same contract:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## Testing

### Backend

```bash
cd backend
npm test
```

Some tests connect to PostgreSQL and require a **disposable test database**:

```bash
# PowerShell
$env:TEST_DATABASE_URL = "postgresql://postgres:password@localhost:5432/gym_supplement_store_test"
npm test
```

```bash
# Bash
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/gym_supplement_store_test" npm test
```

The database-backed tests expect a local PostgreSQL instance because they set `DATABASE_SSL=false`. Database-free tests such as the health and configuration checks run without `TEST_DATABASE_URL`.

### Frontend

```bash
cd frontend
npm test        # Vitest
npm run lint    # Oxlint
npm run build   # Production build
```

### Health checks

```bash
curl http://localhost:5000/health      # API process
curl http://localhost:5000/health/db   # PostgreSQL connectivity
```

After deploying, follow `docs/smoke-test.md` for a five-step verification checklist.

---

## Project Structure

```text
frontend/
├── src/
│   ├── api/            Axios client and API helpers
│   ├── components/     Reusable UI, common, and layout components
│   ├── contexts/       Authentication context
│   ├── layouts/        Public, Admin, and Member layouts
│   ├── pages/          Route pages (public, auth, admin, staff, member)
│   └── App.jsx         Route definitions
└── package.json

backend/
├── src/
│   ├── config/         Environment and PostgreSQL pool configuration
│   ├── controllers/    HTTP request/response handling
│   ├── docs/           OpenAPI specification
│   ├── middlewares/    Auth, authorization, uploads, rate limiting, errors
│   ├── repositories/   Parameterized SQL queries
│   ├── routes/         API route definitions
│   ├── services/       Business logic
│   ├── app.js          Express application setup
│   └── index.js        HTTP server entry point
├── test/               Node.js test runner suites
├── Dockerfile
└── package.json

database/
├── schema/             Table definitions (auth/gym and store)
└── seed/               Demo data

docs/
├── api.md              Endpoint reference
├── decisions.md        Architecture decisions
├── erd/                DBML, SVG, and PNG entity-relationship diagrams
├── postman/            Postman collection and setup guide
├── screenshots/        UI screenshots
└── smoke-test.md       Post-deployment checklist
```

---

## Security Notes

The backend applies baseline hardening:

- **Helmet** for secure HTTP headers and Content Security Policy.
- **Rate limiting** on `POST /api/auth/login` — 5 attempts per 15 minutes per IP.
- **JWT authentication** with role-based authorization.
- **Input validation** for required fields, email format, positive prices, and valid statuses.
- **Ownership checks** on `/api/me/*` — personal data is always queried by the `user_id` from the JWT, never from query parameters.
- **Parameterized SQL** through `pg` to prevent SQL injection.
- **Generic error responses** so database details and stack traces are not exposed to clients.

Operational recommendations:

- Use a long, random `JWT_SECRET` and rotate it if leaked.
- Keep `.env` files out of version control.
- Use Supabase SSL (`DATABASE_SSL=true`) in production.
- Restrict `CORS_ORIGIN` to the deployed frontend URL.
- Change or remove demo accounts before going live.

---

## Team

| Role | Full Name | Student ID | Module |
| --- | --- | --- | --- |
| Member 1 | Nguyễn Đình Sang | 24521521 | Auth + Gym |
| Member 2 | Nguyễn Phan Hoàng Quân | 24521446 | Store |

**Course:** MSIS207.R11.CTTT — Group 28

---

## License

This project was developed for academic purposes as part of the MSIS207.R11.CTTT course. Third-party libraries remain under their respective licenses.
