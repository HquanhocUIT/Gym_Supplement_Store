# Contributing

Guidelines for Group 28 working in the Gym and Supplement Store Management System repository.

## Workflow

1. Choose an assigned task on the Notion board. If it does not have a GitHub issue, create one using the appropriate template.
2. Create a branch from `main` using the conventions below. Do not push directly to `main`.
3. Keep commits focused on the task and update related documentation.
4. Open a PR using the process below.

## Branches

- Keep `main` in a working state; do not push directly to it.
- Create a separate branch for each task using `<type>/<module>-<short-description>`.
- Examples: `feature/store-product-list`, `fix/store-cart-total`, `docs/api-contract-store`, `chore/docker-compose`.
- Types: `feature`, `fix`, `docs`, `chore`, `test`.
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

1. Open a PR from your branch into `main` using the PR template.
2. Fill in blank by follow template: 1. Problem: 2. Fix:
3. Screenshot your output 
4. Request review from teammate before merging.
5. Squash-merge once approved; delete the branch after merge.

## Project structure

- `frontend/`: React + Vite frontend.
- `server/`: backend API, Prisma schema, and migrations.
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
- When changing the schema, include the corresponding Prisma migration and describe its impact in the PR.
- Update `openapi.yaml` in the same PR when changing an endpoint.

## Reporting issues

Use the issue templates (bug report or feature request) and provide enough detail for a teammate to understand, reproduce, or implement the work.
