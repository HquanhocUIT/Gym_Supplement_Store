# Smoke Test Checklist

Use this checklist after every deployment to confirm that the Gym & Supplement Store system is running correctly end to end. The full check should take about five minutes.

**Environment variables used below**

```bash
BACKEND_URL=https://your-backend-url
FRONTEND_URL=https://your-frontend-url
```

On PowerShell:

```powershell
$env:BACKEND_URL = "https://your-backend-url"
$env:FRONTEND_URL = "https://your-frontend-url"
```

---

## Step 1 — Backend liveness returns HTTP 200

Confirm that the API process is up. This check does not require the database.

```bash
curl -i "$BACKEND_URL/health"
```

PowerShell:

```powershell
Invoke-WebRequest "$env:BACKEND_URL/health" | Select-Object StatusCode, Content
```

**Expected**

- HTTP status `200`
- JSON body with `"success": true`
- `"data.status": "ok"`

- [ ] Pass
- [ ] Fail

---

## Step 2 — Database connection is healthy

Confirm that the backend can reach PostgreSQL with the configured SSL settings.

```bash
curl -i "$BACKEND_URL/health/db"
```

**Expected**

- HTTP status `200`
- `"success": true`
- `"data.database": "connected"`

If the response is `503` with code `DATABASE_UNAVAILABLE`, check `DATABASE_URL`, `DATABASE_SSL=true`, and the database credentials in the hosting dashboard.

- [ ] Pass
- [ ] Fail

---

## Step 3 — Frontend loads and calls the API

Open the deployed frontend URL in a browser.

```text
FRONTEND_URL
```

**Expected**

- The landing page renders without a blank screen.
- Navigation links work (`/pricing`, `/shop`, `/login`).
- The browser console shows no fatal errors.
- API requests go to `BACKEND_URL`, not `localhost`.

If requests fail with a CORS error, set the backend `CORS_ORIGIN` to the exact frontend origin and redeploy.

- [ ] Pass
- [ ] Fail

---

## Step 4 — Demo accounts can log in with the correct role

1. Open `FRONTEND_URL/login`.
2. Sign in as **Admin**: `admin@gym.local` / `Admin@123456`.
3. Confirm the admin dashboard is accessible (`/admin`).
4. Sign out and sign in as **Member**: `member@gym.local` / `Member@123456`.
5. Confirm the member portal is accessible (`/member`) and that `/admin` is blocked.

**Expected**

- Admin login redirects to the admin area and the plans/members pages load.
- Member login redirects to the member portal.
- A member cannot open admin-only pages.
- Five failed login attempts within 15 minutes return `429 Too Many Requests`.

- [ ] Pass
- [ ] Fail

---

## Step 5 — Seeded data is available through the API and UI

Verify that the schema and seed scripts ran successfully.

```bash
curl -i "$BACKEND_URL/api/plans"
```

**Expected**

- HTTP status `200`
- `"success": true`
- `"data"` contains the four seeded plans:
  - 1 Month Pass
  - 3 Month Pass
  - 6 Month Pass
  - 1 Year Pass

Then open `FRONTEND_URL/pricing` (or `FRONTEND_URL/shop` for products) and confirm the data renders in the UI.

If the list is empty, re-run `database/seed/01_gym_auth.sql` (and `database/seed/02_store.sql` for products).

- [ ] Pass
- [ ] Fail

---

## Result

| Step | Check | Result |
| --- | --- | --- |
| 1 | Backend `/health` returns 200 | ☐ Pass ☐ Fail |
| 2 | Database `/health/db` returns 200 | ☐ Pass ☐ Fail |
| 3 | Frontend loads and reaches the API | ☐ Pass ☐ Fail |
| 4 | Admin and Member login work | ☐ Pass ☐ Fail |
| 5 | Seeded plans/products are visible | ☐ Pass ☐ Fail |

**Deployment is considered healthy when all five checks pass.**

### Quick troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `502` / `503` from `/health` | Backend is not running or crashed | Check Render logs and the start command |
| `/health/db` returns `503` | Wrong database URL or SSL setting | Verify `DATABASE_URL` and `DATABASE_SSL=true` |
| CORS error in the browser | `CORS_ORIGIN` does not match the frontend URL | Set the exact origin and redeploy |
| Login returns `429` | Rate limit triggered by repeated failures | Wait 15 minutes or restart the backend |
| Plans list is empty | Seed scripts were not run | Run `database/seed/01_gym_auth.sql` |
| Images do not load | Supabase Storage is not configured | Check `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and the bucket name |
