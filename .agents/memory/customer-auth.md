---
name: Customer Auth System
description: JWT + bcrypt email/password auth for Terra customers; how auth integrates with the API client and order linkage.
---

## Auth Strategy
- **Tokens**: JWT in localStorage keyed by restaurant slug (`terra_auth_<slug>`). 30-day expiry.
- **Hashing**: bcryptjs with salt rounds = 10.
- **JWT_SECRET**: `process.env.JWT_SECRET` with fallback dev constant — must change in prod.

## Token Injection
- `setAuthTokenGetter` from `@workspace/api-client-react` (in `lib/api-client-react/src/custom-fetch.ts`) auto-adds `Authorization: Bearer <token>` to every generated API client fetch.
- Wired in `TokenSync` component inside the `R` router wrapper in `App.tsx` — runs inside `CustomerAuthProvider`.

## API Routes (api-server/src/routes/auth.ts)
- `POST /auth/register` — name, email, password (min 6), phone? → returns {token, user}
- `POST /auth/login` — email, password → {token, user}
- `GET /auth/me` — Bearer token → user object
- `PATCH /auth/profile` — Bearer token + {name?, phone?}
- `GET /auth/orders` — Bearer token → all orders for userId with items

## Restaurant Context on Auth
- Auth routes scope by `req.restaurantId` (set from `x-restaurant-slug` header).
- The `x-restaurant-slug` header is sent from `CustomerAuthProvider` which reads slug from `useRestaurant()`.

## DB
- `usersTable` in `lib/db/src/schema/users.ts` — id, restaurantId?, name, email, passwordHash, phone, createdAt.
- `ordersTable.userId` FK → `usersTable.id` (nullable).

## Frontend Files
- `artifacts/food-order/src/lib/customer-auth.tsx` — context provider + hooks
- `artifacts/food-order/src/pages/login.tsx`, `signup.tsx`, `account.tsx`
- Routes: `/r/:slug/login`, `/r/:slug/signup`, `/r/:slug/account`

**Why setAuthTokenGetter instead of manual headers:**
Using the API client's built-in getter means all generated mutations/queries (like `useCreateOrder`) automatically send auth, without modifying each hook call.
