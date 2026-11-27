# Contributing

Guidelines for Group 28 working in the Gym and Supplement Store Management System repository.

## Workflow

1. Choose an assigned task on the Notion board. If it does not have a GitHub issue, create one using the appropriate template.
2. Start from the shared `dev` branch and work on your personal branch, `user/<github-username>`. Do not push directly to `dev` or `main`.
3. Keep commits focused on the task and update related documentation.
4. Open a PR from your personal branch into `dev` using the process below.
5. After integration checks pass, open a release PR from `dev` into `main`. Production deploys from `main` only.

## Branches

- `main` is the stable production branch. Do not push directly to it.
- `dev` is the shared integration branch. Keep it buildable and use it to verify completed work before release.
- Each contributor works on one personal branch created from `dev`, named `user/<github-username>` (for example, `user/hquanhocuit`). Do not share a personal branch between contributors.
- After a PR from a personal branch is merged into `dev`, sync that personal branch with the latest `dev` before starting more work.
- Create short-lived task branches from your personal branch only when a task needs isolated parallel work; merge them back into that personal branch before opening the PR to `dev`.
- Use `<type>/<module>-<short-description>` for these short-lived task branches.
- Examples: `feature/store-product-list`, `fix/store-cart-total`, `docs/api-contract-store`, `chore/docker-compose`.
- Types: `feature`, `fix`, `docs`, `chore`, `test`, `user`.
- Use lowercase ASCII characters with hyphens between words; do not use spaces.

## Commits

Use `<type>(<scope>): <short imperative summary>`.

Common types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`.

```text
feat(store): add product catalog endpoint
fix(store): restore stock after order cancellation
docs(project): add contribution guide
```

## Pull requests

1. Open a PR from your personal branch into `dev` using the PR template.
2. Fill in blank by follow template: 1. Problem: 2. Fix:
3. Screenshot your output 
4. Request review from teammate before merging.
5. Squash-merge once approved. Keep personal branches; delete short-lived task branches after merge.
6. When the team is ready to release, open a separate PR from `dev` into `main`, review it, and merge after checks pass.

## Project structure

- `frontend/`: React + Vite frontend.
- `backend/`: Express API using `pg` and PostgreSQL.
- `database/schema/`, `database/seed/`, `database/migrations/`: SQL schema, demo data, and migrations (added with the database tasks).
- `.github/`: issue and PR templates.

## API response convention

Use the `success`, `data`, and `error` keys in API JSON responses.

Success:

```json
{
  "success": true,
  "data": { "id": "..." },
  "error": null
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request data is invalid",
    "details": []
  }
}
```

Do not include sensitive information in `message` or `details`. Update `openapi.yaml` when an API changes, and notify the client developer if the contract is affected.

## Data changes and configuration

- Never commit `.env` files, tokens, secrets, or real user data. Update `.env.example` when adding an environment variable.
- Put SQL in `backend/src/repositories/` and use the shared `pg` Pool from `backend/src/config/db.js`.
- Pass input values as SQL parameters (`$1`, `$2`, etc.); never concatenate input into SQL. Transactions must use one checked-out client, released in `finally`.
- When changing an established schema, add a new SQL file in `database/migrations/` and describe its impact and execution order in the PR. Initial schema and seed files belong to Tasks 14 and 15 after ERD approval.
- Update `openapi.yaml` in the same PR when changing an endpoint.

## Reporting issues

Use the issue templates (bug report or feature request) and provide enough detail for a teammate to understand, reproduce, or implement the work.
