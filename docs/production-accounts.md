# Production accounts

Deployment creates neither demo accounts nor passwords. The accounts in the README exist only after the Auth/Gym seed has been loaded into that database.

## Create the first administrator

1. Open the deployed registration page and register the email you want to use as administrator. Choose your own password.
2. In the Supabase SQL Editor for the production project, check the account you just registered. Replace the email below with that account.

```sql
SELECT id, email, role
FROM public.users
WHERE email = 'your-admin-email@example.com';
```

3. After confirming the account is yours, assign its role.

```sql
UPDATE public.users
SET role = 'admin', updated_at = now()
WHERE email = 'your-admin-email@example.com'
RETURNING id, email, role;
```

4. Sign out, then sign in again through /admin/login. This issues a new token containing the updated role.

Passwords are entered on the registration page. The API hashes them before saving them. Account roles are assigned through the database by the project owner; public registration always creates a member.

## English sample catalog

For an existing database containing the Vietnamese sample descriptions, run database/migrations/03_catalog_english.sql in the SQL Editor. It updates descriptions that still match the original seed text. It can be run again without changing already translated descriptions.
