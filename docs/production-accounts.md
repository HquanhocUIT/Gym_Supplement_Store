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

## Product photos on the live site

The sample catalog does not include product photos. Add your own photos through Admin → Products. Expand a product, choose a JPG, PNG or WebP file up to 5 MB, then use Upload photo or Replace photo. The same saved URL is used by the shop and product detail page.

For production uploads, configure SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_STORAGE_BUCKET in the Render service environment. Set the bucket name to product-images and make that bucket public for product photo viewing. These values belong to the backend; never add the secret key to Vercel frontend variables or commit it. Save and redeploy the Render service after changing its environment.

## Member navigation

- /member shows the signed-in account's membership and order summary.
- /member/plan shows real memberships and check-in history.
- /member/orders and /member/orders/:orderId show only that account's purchases.
- /member/dashboard redirects to /member so the old login destination remains valid.

Empty sections explain the next action instead of displaying sample people, workouts or orders. An order created at checkout can be reopened from its confirmation screen and after refreshing the account pages.

## Header search

The search icon opens a keyword field with page suggestions. Product names open the shop with q in the URL; orders opens My orders, my plan opens the account's membership, and gym or membership plans opens the available plans. Vietnamese keywords such as đơn hàng and giỏ hàng are also supported. Guests who choose a protected account page return to that page after signing in. Admin search offers management pages and searches the product inventory.

## Back and Forward behavior

In Shop, Admin Products and Admin Members, typing into one field creates one history step for that editing session. Back restores the previous keyword, filters and page; Forward restores the completed input. Selecting a category, changing sort order, clearing filters and changing pages can also be undone with Back. Members reads the API's members/pagination response and shows an error if loading fails rather than displaying sample accounts.

Product and order detail pages return to the list entry that opened them, preserving its filters and page number. Directly opened detail links use a safe default list. Orders keeps its page in the URL so refreshing a page-2 list does not reset it to page 1.
