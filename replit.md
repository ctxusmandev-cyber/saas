# Terra — Multi-Tenant Food Ordering SaaS

A fully professional food ordering SaaS platform. Multiple restaurants each get their own customer site (`/r/:slug/*`) and admin panel (`/r/:slug/admin/*`), with a super admin dashboard at `/super-admin/*`.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter v3 + TanStack Query + Tailwind CSS + shadcn/ui
- API: Express 5 (artifact: `artifacts/api-server`, port 8080, path prefix `/api`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec`)
- API client: `lib/api-client-react` (generated React Query hooks + custom fetch with `setDefaultHeader`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (source of truth: restaurants, categories, menu_items, orders, order_items)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/` — generated hooks + `custom-fetch.ts` (supports `setDefaultHeader`)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/food-order/src/` — React frontend
  - `pages/` — customer + admin + super-admin pages
  - `components/` — Layout, AdminLayout, SuperAdminLayout, AdminGuard, etc.
  - `lib/restaurant-context.tsx` — RestaurantProvider (fetches restaurant, sets x-restaurant-id header)
  - `lib/admin-auth.tsx` — AdminAuthProvider (DB-backed per-restaurant) + SuperAdminProvider
  - `lib/use-slug.ts` — `useSlug()` and `useRestaurantPath()` hooks for slug-aware navigation

## URL Structure

| Path | Description |
|------|-------------|
| `/r/:slug` | Restaurant homepage |
| `/r/:slug/menu` | Menu page |
| `/r/:slug/checkout` | Checkout |
| `/r/:slug/order/:id` | Order tracking |
| `/r/:slug/my-orders` | My orders |
| `/r/:slug/admin/login` | Restaurant admin login |
| `/r/:slug/admin` | Restaurant admin dashboard |
| `/r/:slug/admin/orders` | Orders management (with detail popup) |
| `/r/:slug/admin/menu` | Menu items management |
| `/r/:slug/admin/categories` | Categories management |
| `/super-admin/login` | Super admin login |
| `/super-admin` | Super admin dashboard (manage all restaurants) |
| `/admin/*` | Redirects to `/r/terra/admin/*` |
| `/` | Redirects to `/r/terra` |

## Credentials

- Terra admin password: `terra@admin2024`
- Super admin password: `super@terra2024`

## Architecture decisions

- **Flat Wouter v3 routing**: Wouter v3 uses nested path context inside matched routes, so all routes are declared flat in the top-level Switch to avoid prefix-stripping issues in nested Switches.
- **Restaurant context via header**: `RestaurantProvider` fetches `/api/restaurants/:slug` and calls `setDefaultHeader("x-restaurant-id", id)` so all API calls are automatically scoped to the correct restaurant.
- **DB-backed admin auth**: Per-restaurant admin login posts to `/api/restaurants/:slug/login` and compares plain-text password stored in the `restaurants` table. Session stored in `sessionStorage`.
- **Seed on startup**: `seedDefaultRestaurant()` runs in `artifacts/api-server/src/index.ts` before the server starts, ensuring the "terra" restaurant always exists and migrating legacy data.
- **Multi-tenant API filtering**: All API routes read `req.restaurantId` (set from `X-Restaurant-ID` header by middleware) and use Drizzle `eq` filters to scope queries to the correct restaurant.

## Product

- Multi-tenant food ordering SaaS
- Each restaurant has its own branded customer-facing site and admin panel
- Customers can browse menu by category, add items to cart, checkout with JazzCash/EasyPaisa/Cash on Delivery
- Admins can manage menu items, categories, and orders (with detail popup); receive real-time new order notifications
- Super admins can create/edit/delete restaurants and access any restaurant's admin panel

## Gotchas

- Do NOT add `import.meta.env.BASE_URL` manually — the Vite config and WouterRouter handle this automatically.
- Always use `useRestaurantPath()` (from `lib/use-slug.ts`) for navigation links inside restaurant pages — never hardcode `/menu`, `/checkout`, etc.
- The `setDefaultHeader` in custom-fetch merges before auth headers, so restaurant filtering always applies.
- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
