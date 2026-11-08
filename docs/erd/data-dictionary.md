# Data Dictionary - Gym & Supplement Store

> Task 13 review draft: `erd-v1.dbml` contains the proposed columns and
> `erd-task13.png` / `erd-task13.svg` show the proposed diagram. `erd-v1.png`
> is the older Task 12 diagram. See `../decisions.md` for review and constraints.

## 1. Auth & Gym Module
*   **`users`**: Stores all accounts (Admin, Staff, Member). The `role` column handles RBAC.
*   **`membership_plans`**: The available gym packages (e.g., 1 Month, 1 Year).
*   **`memberships`**: Tracks which user bought which plan, including `start_date` and `end_date`. Used to check if a member gets a 10% discount.
*   **`checkins`**: History of when a member enters the gym.

## 2. Store Module
*   **`categories`**: Product categories (Whey, Creatine, Accessories).
*   **`products`**: The general product info and one optional product image URL.
*   **`product_variants`**: Specific versions of a product (e.g., Chocolate 1kg, Vanilla 2kg). This holds the `price` and `stock`.
*   **`carts` & `cart_items`**: Temporary storage for items before checkout.
*   **`orders` & `order_items`**: Purchases, delivery details, discount and totals. Order items preserve the product name, variant description and price at purchase time.

## 3. Shared Module
*   **`payments`**: Handles money transactions. It connects to **exactly one** of `order_id` (Store) or `membership_id` (Gym), leaving the other column `NULL`.
