# Dokan360 — Project Blueprint

> **Bengali POS SaaS Dashboard** — দোকানদারদের জন্য সম্পূর্ণ বাংলা ভাষায় বিক্রয় ব্যবস্থাপনা সফটওয়্যার।
> এই ফাইলটি project-এর living spec। প্রতিটি feature implement হলে এখানে status আপডেট হবে।
> GitHub থেকে import করলে এই file দেখে পুরো app বুঝে build করা যাবে।

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Architecture](#4-architecture)
5. [Design System](#5-design-system)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Feature Registry](#8-feature-registry)
9. [Page & Component Map](#9-page--component-map)
10. [Setup & Run Guide](#10-setup--run-guide)
11. [Conventions & Rules](#11-conventions--rules)

---

## 1. Project Overview

**Dokan360** একটি বাংলা-ভাষী POS (Point of Sale) SaaS dashboard যা ছোট ও মাঝারি দোকানদারদের জন্য তৈরি।

| বিষয় | বিবরণ |
|---|---|
| **Target User** | বাংলাদেশের ছোট-মাঝারি দোকানদার |
| **Language** | Bengali (বাংলা) UI — সব label, toast, error বাংলায় |
| **Currency** | BDT (৳) — `bn-BD` locale formatting |
| **Auth Model** | Supabase Auth — JWT verify via supabaseAdmin.auth.getUser(), multi-user per shop |
| **Roles** | `admin`, `seller`, `viewer` |
| **Theme** | Light / Dark / System — next-themes |
| **Fonts** | Hind Siliguri (Bengali), Inter (Latin) — Google Fonts |

---

## 2. Tech Stack

### Frontend (`artifacts/dokan360`)
| Layer | Package | Version |
|---|---|---|
| Framework | React + Vite | 19.x / 7.x |
| Routing | wouter | latest |
| State / Data | @tanstack/react-query | v5 |
| API Client | orval-generated hooks | auto |
| UI Components | shadcn/ui (Radix) | latest |
| Styling | Tailwind CSS v4 | latest |
| Forms | react-hook-form + zod | latest |
| Charts | recharts | latest |
| Theme | next-themes | latest |

### Backend (`artifacts/api-server`)
| Layer | Package |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Logging | pino + pino-http |
| Validation | zod (via api-zod) |
| Auth | Supabase Auth (supabaseAdmin.auth.getUser for JWT verify) |
| Security Headers | helmet |
| Rate Limiting | express-rate-limit |

### Database & ORM (`lib/db`)
| Layer | Package |
|---|---|
| ORM | Drizzle ORM |
| DB | **PostgreSQL — Supabase hosted (`SUPABASE_DATABASE_URL`)** |
| Migrations | drizzle-kit push |
| Schema validation | drizzle-zod |
| Connection | Session pooler (port 5432, SSL) |

### Shared Libraries
| Package | কাজ |
|---|---|
| `lib/api-spec` | OpenAPI 3.1 spec (`openapi.yaml`) — single source of truth |
| `lib/api-client-react` | orval-generated React Query hooks |
| `lib/api-zod` | orval-generated Zod schemas for backend validation |
| `lib/db` | Drizzle schema + DB client |

---

## 3. Monorepo Structure

```
workspace/
├── artifacts/
│   ├── dokan360/              # React+Vite frontend
│   │   ├── src/
│   │   │   ├── pages/         # Route-level pages
│   │   │   ├── components/    # Reusable UI components
│   │   │   │   ├── products/  # Product module components
│   │   │   │   └── ui/        # shadcn/ui primitives
│   │   │   ├── layouts/       # AppLayout, sidebar, topbar
│   │   │   ├── contexts/      # AuthContext, ThemeContext
│   │   │   ├── hooks/         # use-toast, custom hooks
│   │   │   ├── lib/           # utils (cn, etc.)
│   │   │   ├── App.tsx        # Router + Providers
│   │   │   └── index.css      # CSS variables, design tokens
│   │   └── .replit-artifact/artifact.toml
│   │
│   └── api-server/            # Express backend (Clean Architecture)
│       └── src/
│           ├── modules/       # Feature modules (each: router + service)
│           │   ├── auth/      #   auth.router.ts, auth.service.ts
│           │   ├── products/  #   products.router.ts, products.service.ts
│           │   ├── categories/#   categories.router.ts, categories.service.ts
│           │   ├── customers/ #   customers.router.ts, customers.service.ts
│           │   ├── sales/     #   sales.router.ts, sales.service.ts
│           │   ├── inventory/ #   inventory.router.ts, inventory.service.ts
│           │   ├── dashboard/ #   dashboard.router.ts, dashboard.service.ts
│           │   ├── reports/   #   reports.router.ts, reports.service.ts
│           │   ├── sync/      #   sync.service.ts (TASK 11 — offline stub, not mounted)
│           │   └── ai/        #   ai.service.ts   (TASK 12 — AI stub, not mounted)
│           ├── config/        # env.ts — Zod-validated central config module
│           ├── common/        # errors.ts, pagination.ts, response.ts, types.ts
│           ├── middleware/    # auth, error, validate middleware
│           ├── utils/         # auth.utils.ts, query.utils.ts
│           ├── lib/           # vite-proxy.ts (dev utility)
│           ├── router.ts      # Top-level API router
│           └── app.ts         # Express app setup
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml       # ← OpenAPI spec (edit here first!)
│   ├── api-client-react/
│   │   └── src/generated/     # ← auto-generated, do not edit
│   ├── api-zod/
│   │   └── src/generated/     # ← auto-generated, do not edit
│   └── db/
│       └── src/schema/        # Drizzle table definitions
│
├── BLUEPRINT.md               # ← এই ফাইল
└── pnpm-workspace.yaml
```

---

## 4. Architecture

### Backend — Clean Architecture Layers

```
HTTP Request
    │
    ▼
router.ts           ← top-level router, mounts all module routers
    │
    ▼
modules/<x>/<x>.router.ts   ← thin: validates input, calls service, returns HTTP
    │ zod validation (api-zod schemas)
    ▼
modules/<x>/<x>.service.ts  ← business logic (no HTTP concerns)
    │
    ▼
Drizzle ORM (lib/db)        ← database layer (replaceable)
    │
    ▼
PostgreSQL (DATABASE_URL)   ← Replit managed / Supabase / any Postgres
```

**Layer Rules:**
- `router.ts` — HTTP only: parse, validate, respond. No DB imports.
- `service.ts` — Business logic only. No `req`/`res`. Throws `AppError` subclasses.
- `common/errors.ts` — Shared error classes (AppError, NotFoundError, ValidationError, etc.)
- `common/pagination.ts` — Reusable pagination helpers (`getPaginationOptions`, `paginate`).
- `common/response.ts` — Standardized HTTP response helpers (`ok`, `created`, `noContent`, etc.)
- `utils/auth.utils.ts` — Pure JWT/crypto functions. No Express dependency.
- `utils/query.utils.ts` — Shared DB query helpers (`buildDateRange`, `buildSearch`, `parseIntId`).
- `middleware/` — Express middleware only. Imports from `utils/` and `common/`.
- `modules/sync/` — Offline sync service stub (Phase 2). See TASK 11 roadmap.
- `modules/ai/` — AI service stub (Phase 3). See TASK 12 roadmap.

### Data Flow

```
User Action
    │
    ▼
React Component
    │ react-hook-form / useState
    ▼
React Query Hook (useCreateProduct, etc.)
    │ generated by orval from openapi.yaml
    ▼
API Client (fetch → /api/...)
    │ JWT Bearer token (localStorage: dokan360_token)
    ▼
Express Route Handler (modules/<x>/<x>.router.ts)
    │ zod validation (api-zod schemas)
    ▼
Service Layer (modules/<x>/<x>.service.ts)
    │ business logic
    ▼
Drizzle ORM Query
    │
    ▼
PostgreSQL Database
```

### Auth Flow

```
Login → POST /api/auth/login
      ← { accessToken, refreshToken, user }
         accessToken → localStorage("dokan360_token")   [15min TTL]
         refreshToken → localStorage("dokan360_refresh") [30day TTL]

Protected Request → Authorization: Bearer <accessToken>

Token Expired → POST /api/auth/refresh  (rotation-on-use)
              ← { accessToken, refreshToken }  ← new pair issued, old revoked

Logout → POST /api/auth/logout (revokes refreshToken in DB)
       → clear localStorage
```

### Security Architecture (TASK 2 — implemented)

| Layer | কী করা হয়েছে |
|---|---|
| **Helmet** | HTTP security headers: CSP, HSTS (prod), X-Frame-Options: DENY, XSS-Protection |
| **Rate Limiting** | Login: 10/15min, Register: 5/hr, Refresh: 20/min, General API: 200/min (prod only) |
| **CSRF Protection** | Origin header check on state-changing requests (production); Bearer token auth inherently CSRF-safe |
| **Device Tracking** | IP + User-Agent stored in `refresh_tokens` on every login/refresh |
| **Suspicious Login** | New IP detection — if login IP ≠ all recent known IPs → `login_suspicious` audit event |
| **Audit Logs** | All auth events written to `audit_logs` table with userId, shopId, IP, userAgent, meta |
| **Token Hardening** | Refresh tokens: SHA-256(jti) hashed in DB; rotation-on-use (old token revoked on refresh); `lastUsedAt` tracked |
| **Password Security** | bcrypt (10 rounds); legacy SHA-256 shim auto-upgrades to bcrypt on first login; rehash check fixed |
| **Trust Proxy** | `app.set("trust proxy", 1)` in production for correct IP extraction behind Replit proxy |
| **Request Logging** | pino-http logs every request (method, URL, status) with sensitive headers redacted |

### Logging Architecture (TASK 3 — implemented)

| Concern | বিবরণ |
|---|---|
| **Logger** | `pino` — `common/logger.ts`; ISO timestamp; sensitive fields redacted (`[REDACTED]`) |
| **Dev format** | `pino-pretty` — colorized, human-readable, `HH:MM:ss.l` timestamp, no pid/hostname noise |
| **Prod format** | JSON (newline-delimited) — machine-parseable; `pid` + `hostname` included as base fields |
| **Request tracing** | `pino-http` generates a unique `X-Request-Id` (UUID v4) per request; echoed back in response header |
| **Upstream Request-Id** | Accepts `X-Request-Id` from upstream proxy/client — re-uses if present (no duplicate IDs) |
| **Per-request child logger** | `req.log` is a pino child logger auto-created by pino-http; carries `reqId` in every log line |
| **Auth context binding** | After `requireAuth` middleware, `req.log` is re-bound as child with `{ userId, shopId, role }` — all downstream logs carry user context automatically |
| **Error logging** | 4xx `AppError` → `warn` level; 5xx / unhandled → `error` level with full `err` object + `requestId` |
| **Healthz suppression** | `/api/healthz` not logged in production to avoid log noise |
| **Log levels** | `LOG_LEVEL` env var (`fatal`/`error`/`warn`/`info`/`debug`/`trace`), default `info` |

### Health Monitoring Architecture (TASK 4 — implemented)

**Files:** `src/modules/health/health.service.ts`, `src/modules/health/health.router.ts`

| Endpoint | Purpose | HTTP Status |
|---|---|---|
| `GET /api/health` | Server is running — no dependency check | `200` always |
| `GET /api/healthz` | Alias for `/health` (backward compat) | `200` always |
| `GET /api/live` | Process is alive — liveness probe | `200` always |
| `GET /api/ready` | DB reachable — readiness probe | `200` ok / `503` down |

**Response shape:**

```json
// /health, /healthz, /live
{ "status": "ok", "uptimeSeconds": 142, "timestamp": "2026-05-08T..." }

// /ready (healthy)
{ "status": "ok", "uptimeSeconds": 142, "timestamp": "...", "checks": { "database": { "status": "ok", "latencyMs": 4 } } }

// /ready (DB down)
{ "status": "down", "uptimeSeconds": 142, "timestamp": "...", "checks": { "database": { "status": "down", "error": "..." } } }
```

| বিষয় | বিবরণ |
|---|---|
| **DB check** | `pool.query("SELECT 1")` — pg connection pool থেকে একটি connection নিয়ে roundtrip করে |
| **Latency tracking** | DB query latency milliseconds-এ রিপোর্ট করে |
| **Uptime** | Server process start থেকে এখন পর্যন্ত সেকেন্ড |
| **No auth** | সব health endpoint public — auth middleware নেই |
| **503 on failure** | `/ready` — DB down হলে `503 Service Unavailable` return করে যাতে load balancer traffic route না করে |

```
Request arrives
    │
    ▼
pino-http middleware
    │  generates/accepts X-Request-Id
    │  creates req.log child logger { reqId }
    ▼
requireAuth middleware (if protected route)
    │  re-binds req.log.child({ userId, shopId, role })
    ▼
Route handler / Service
    │  any req.log.info(...) carries: reqId + userId + shopId
    ▼
Error handler (if error)
    │  uses req.log (or root logger as fallback)
    │  4xx → warn, 5xx → error
    ▼
Response
    │  X-Request-Id header echoed back to client
```

### Multi-tenant (Shop) Model

প্রতিটি shop আলাদা। সব data (products, sales, customers, inventory) `shop_id` দিয়ে isolated। একজন user একটি shop-এর সাথে সংযুক্ত।

### Code Generation

```bash
# OpenAPI spec থেকে React hooks ও Zod schemas generate করা
pnpm run --filter @workspace/api-spec codegen
```
**Rule:** কখনো generated files সরাসরি edit করবেন না। `openapi.yaml` edit করুন, তারপর codegen চালান।

---

## 5. Design System

### Color Palette (CSS Variables — `index.css`)

| Token | Light | Dark | ব্যবহার |
|---|---|---|---|
| `--primary` | `262 83% 58%` | `262 83% 68%` | Violet — primary action |
| `--background` | `0 0% 100%` | `224 71% 4%` | Page background |
| `--foreground` | `224 71% 4%` | `213 31% 91%` | Body text |
| `--card` | `0 0% 100%` | `224 71% 6%` | Card surface |
| `--muted` | `220 14% 96%` | `215 28% 17%` | Subtle backgrounds |
| `--border` | `220 13% 91%` | `216 34% 17%` | Borders |
| `--destructive` | `0 84% 60%` | `0 63% 31%` | Error / delete |

### Typography

```css
font-family: 'Hind Siliguri', 'Inter', sans-serif;
/* Hind Siliguri → Bengali text */
/* Inter → Latin/numbers */
```

### Bengali Conventions

- Currency: `৳` symbol, `Number.toLocaleString('bn-BD')` formatting
- Date: `new Date().toLocaleDateString('bn-BD')`
- All UI labels, toast messages, error text → বাংলায়
- Stock unit default: `পিস`

### Component Patterns

- **Letter Avatar:** পণ্যের নামের প্রথম অক্ষর, category অনুযায়ী রঙ
- **Stock Badge:** স্টক শেষ (লাল) / কম মজুদ (কমলা) / সংখ্যা (স্বাভাবিক)
- **Filter Badges:** Active filter গুলো ×-সহ badge হিসেবে দেখানো
- **Hover Actions:** Table row hover করলে Edit/Delete দেখা যায়

---

## 6. Database Schema

### Tables

#### `shops`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| name | text | দোকানের নাম |
| address | text? | ঠিকানা |
| phone | text? | ফোন |
| currency | text | default: `BDT` |
| createdAt, updatedAt | timestamp | |

#### `users`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| name | text | |
| email | text unique | |
| supabaseUid | text unique | Supabase Auth UID |
| role | enum | `admin` / `seller` / `viewer` — permission enforcement |
| userRoleId | FK → user_roles.id? | `user_roles` table-এর সাথে FK link — display label-এর জন্য |
| isActive | boolean | |
| shopId | FK → shops | |

#### `categories`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| nameBn | text | বাংলা নাম |
| nameEn | text? | English নাম |
| shopId | FK → shops | |

#### `products`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| nameBn | text | বাংলা নাম |
| nameEn | text? | English নাম |
| sku | text? | Stock Keeping Unit |
| barcode | text? | Barcode |
| price | numeric(12,2) | বিক্রয় মূল্য |
| costPrice | numeric(12,2)? | ক্রয় মূল্য |
| stockQuantity | integer | বর্তমান মজুদ |
| minStockLevel | integer | সর্বনিম্ন মজুদ সীমা (default: 5) |
| unit | text | একক (default: পিস) |
| categoryId | FK → categories? | |
| shopId | FK → shops | |
| isActive | boolean | |

#### `customers`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| name | text | |
| phone | text? | |
| email | text? | |
| address | text? | |
| balance | numeric(12,2) | বকেয়া/অগ্রিম (ledger balance) |
| totalPurchase | numeric(12,2) | মোট কেনাকাটা |
| shopId | FK → shops | |

#### `sales`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| invoiceNumber | text unique | চালান নম্বর |
| customerId | FK → customers? | |
| userId | FK → users? | কে বিক্রি করেছে |
| shopId | FK → shops | |
| total | numeric(12,2) | মোট |
| discount | numeric(12,2) | ছাড় |
| paid | numeric(12,2) | পরিশোধিত |
| due | numeric(12,2) | বকেয়া |
| paymentMethod | text | `cash` / `bkash` / `nagad` / `card` / `credit` |
| note | text? | |

#### `sale_items`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| saleId | FK → sales | |
| productId | integer | |
| productNameBn | text | snapshot at time of sale |
| quantity | numeric(10,3) | |
| price | numeric(12,2) | |
| subtotal | numeric(12,2) | |

#### `inventory_adjustments`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| productId | FK → products | |
| productNameBn | text | |
| quantity | integer | |
| type | text | `in` / `out` / `adjustment` |
| reason | text? | |
| userId | FK → users? | |

#### `ledger_entries`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| customerId | FK → customers | |
| saleId | FK → sales? | |
| type | text | `sale` / `payment` / `adjustment` |
| amount | numeric(12,2) | |
| balance | numeric(12,2) | running balance |
| note | text? | |

#### `refresh_tokens`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| userId | FK → users | |
| tokenHash | text unique | SHA-256(jti) hash |
| expiresAt | timestamp | 30-day TTL |
| revoked | boolean | rotation-on-use — consumed token marked revoked |
| ip | text? | login IP (device tracking) |
| userAgent | text? | browser/device info |
| lastUsedAt | timestamp? | last token refresh timestamp |
| createdAt | timestamp | |

#### `audit_logs`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| userId | integer? | কে করেছে |
| shopId | integer? | কোন shop |
| action | text | `login_success`, `login_failed`, `login_suspicious`, `logout`, `register`, `token_refresh`, `token_refresh_failed`, `password_changed`, `user_invited`, `user_deactivated`, `user_role_changed`, `sale_created`, `product_created`, `product_updated`, `product_deleted`, `stock_adjusted`, `settings_updated` |
| ip | text? | request IP |
| userAgent | text? | browser/device |
| meta | jsonb? | extra context (e.g. `knownIps`, `reason`) |
| createdAt | timestamp | |

#### `employees`
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| shopId | FK → shops | |
| employeeCode | text? | কর্মী আইডি (যেমন EMP-001) |
| name | text | পূর্ণ নাম |
| fatherName | text? | পিতার নাম |
| motherName | text? | মাতার নাম |
| phone | text? | ফোন নম্বর |
| emergencyContact | text? | জরুরি যোগাযোগ |
| email | text? | ইমেইল |
| address | text? | ঠিকানা |
| nidNumber | text? | এনআইডি নম্বর |
| dateOfBirth | date? | জন্ম তারিখ |
| gender | employee_gender? | male / female / other |
| joiningDate | date? | যোগদানের তারিখ |
| bloodGroup | employee_blood_group? | A+/A-/B+/B-/O+/O-/AB+/AB- |
| salary | numeric(12,2)? | মাসিক বেতন |
| status | employee_status | active / inactive / suspended / resigned (default: active) |
| department | text? | বিভাগ |
| designation | text? | পদবী |
| photo | text? | ছবির URL |
| notes | text? | নোট |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### `user_module_access` — TASK 37
| Column | Type | বিবরণ |
|---|---|---|
| id | serial PK | |
| shopId | FK → shops | |
| userId | FK → users | |
| allowedModules | text | JSON array of module keys (dashboard, pos, sales, …) |
| dataRestriction | text | `none` / `own_sales` / `assigned_outlet` / `hr_only` |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| UNIQUE | (shopId, userId) | per shop per user একটি row |

### Entity Relationships

```
shops ──┬── users (role: admin/seller/viewer)
        ├── categories
        ├── products ──── categories
        ├── customers ─── ledger_entries
        ├── employees
        ├── user_module_access (per-user module access control)
        └── sales ────┬── sale_items ── products
                      └── customers
```

---

## 7. API Endpoints

Base URL: `/api`  
Auth: `Authorization: Bearer <accessToken>` (সব protected route-এ)

### Health (`/api`)
| Method | Path | কাজ | Auth |
|---|---|---|---|
| GET | `/health` | Server liveness (no dep check) | ❌ |
| GET | `/healthz` | Alias for `/health` | ❌ |
| GET | `/live` | Process alive (liveness probe) | ❌ |
| GET | `/ready` | DB reachable (readiness probe) | ❌ |

### Auth (`/api/auth`)
| Method | Path | কাজ | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login, returns tokens | ❌ |
| POST | `/auth/register` | নতুন shop + admin তৈরি | ❌ |
| GET | `/auth/me` | Current user info | ✅ |
| POST | `/auth/refresh` | Access token refresh | ❌ |
| POST | `/auth/logout` | Refresh token revoke | ❌ |
| GET | `/auth/users` | Shop-এর সব user (admin) | ✅ admin |
| POST | `/auth/users` | User invite (admin) | ✅ admin |
| PATCH | `/auth/users/:id` | User role/status update | ✅ admin |

### User Access (`/api/user-access`) — TASK 37
| Method | Path | কাজ | Auth |
|---|---|---|---|
| GET | `/user-access` | Shop-এর সব user access list | ✅ admin |
| GET | `/user-access/:userId` | নির্দিষ্ট user-এর access | ✅ admin |
| PUT | `/user-access/:userId` | User access update (modules + dataRestriction) | ✅ admin |
| DELETE | `/user-access/:userId/reset` | User access reset (default সব module চালু) | ✅ admin |

### Products (`/api/products`)
| Method | Path | কাজ | Query Params |
|---|---|---|---|
| GET | `/products` | পণ্য তালিকা | `search`, `categoryId`, `lowStock` |
| POST | `/products` | নতুন পণ্য তৈরি | — |
| PUT | `/products/:id` | পণ্য আপডেট | — |
| DELETE | `/products/:id` | পণ্য নিষ্ক্রিয় (`isActive=false`) | — |

### Categories (`/api/categories`)
| Method | Path | কাজ |
|---|---|---|
| GET | `/categories` | সব বিভাগ |
| POST | `/categories` | নতুন বিভাগ |
| PUT | `/categories/:id` | বিভাগ আপডেট |
| DELETE | `/categories/:id` | বিভাগ মুছুন |

### Customers (`/api/customers`)
| Method | Path | কাজ |
|---|---|---|
| GET | `/customers` | গ্রাহক তালিকা (search query param) |
| POST | `/customers` | নতুন গ্রাহক তৈরি |
| GET | `/customers/:id` | গ্রাহক বিস্তারিত |
| PATCH | `/customers/:id` | গ্রাহক আপডেট |
| DELETE | `/customers/:id` | গ্রাহক মুছুন (ledger থাকলে blocked) |
| POST | `/customers/:id/payment` | পরিশোধ গ্রহণ (ledger entry তৈরি + balance update) |
| GET | `/customers/:id/ledger` | সম্পূর্ণ ledger ইতিহাস |

### Sales (`/api/sales`)
| Method | Path | কাজ | Query Params |
|---|---|---|---|
| GET | `/sales` | বিক্রয় তালিকা | `from`, `to`, `customerId` |
| POST | `/sales` | নতুন বিক্রয় (POS) | — |
| GET | `/sales/:id` | বিক্রয় বিস্তারিত + items | — |

### Inventory (`/api/inventory`)
| Method | Path | কাজ |
|---|---|---|
| GET | `/inventory` | মজুদ তালিকা |
| POST | `/inventory/adjust` | মজুদ সমন্বয় (in/out/adjustment) |
| GET | `/inventory/adjustments` | সমন্বয় ইতিহাস |

### Dashboard (`/api/dashboard`)
| Method | Path | কাজ |
|---|---|---|
| GET | `/dashboard/summary` | KPI summary (আজ, এই মাস) |
| GET | `/dashboard/top-products` | শীর্ষ বিক্রীত পণ্য |
| GET | `/dashboard/sales-chart` | বিক্রয় chart data (7/30 দিন) |
| GET | `/dashboard/recent-sales` | সাম্প্রতিক বিক্রয় |

### Employees (`/api/employees`) ✅ TASK 35
| Method | Path | Query Params | বিবরণ |
|---|---|---|---|
| GET | `/employees` | `search`, `department`, `designation`, `status` | কর্মী তালিকা (shop-scoped) |
| GET | `/employees/stats` | — | কর্মী পরিসংখ্যান (total, active, inactive, suspended, resigned) |
| GET | `/employees/:id` | — | একক কর্মীর বিস্তারিত |
| POST | `/employees` | — | নতুন কর্মী যোগ |
| PATCH | `/employees/:id` | — | কর্মী তথ্য আপডেট |
| DELETE | `/employees/:id` | — | কর্মী মুছে ফেলা |

### Attendance (`/api/attendance`) ✅ TASK 39
| Method | Path | Query Params | বিবরণ |
|---|---|---|---|
| GET | `/attendance` | `employeeId`, `from`, `to`, `status`, `page`, `limit` | উপস্থিতি তালিকা (shop-scoped, paginated) |
| GET | `/attendance/today` | — | আজকের সকল কর্মীর উপস্থিতি + summary |
| POST | `/attendance/check-in` | — | কর্মীর চেক-ইন (lateMinutes auto-calculated) |
| POST | `/attendance/check-out` | — | কর্মীর চেক-আউট (overtimeMinutes auto-calculated) |
| POST | `/attendance` | — | ম্যানুয়াল রেকর্ড তৈরি |
| PATCH | `/attendance/:id` | — | রেকর্ড আপডেট |
| DELETE | `/attendance/:id` | — | রেকর্ড মুছে ফেলা |
| GET | `/attendance/report` | `year`, `month`, `employeeId` | মাসিক রিপোর্ট (per-employee stats) |

**DB**: `attendance_records` table + `attendance_status` enum (present/absent/late/half_day/holiday/leave)
**Schema**: `lib/db/src/schema/attendance.ts`
**Backend**: `artifacts/api-server/src/modules/attendance/`
**Frontend**: `/attendance` route → `Attendance.tsx` + `TodayAttendanceTab`, `HistoryTab`, `ReportTab`

### Schedules (`/api/schedules`, `/api/shifts`) ✅ TASK 40
| Method | Path | Query Params | বিবরণ |
|---|---|---|---|
| GET | `/shifts` | — | সকল শিফট তালিকা (shop-scoped) |
| POST | `/shifts` | — | নতুন শিফট তৈরি |
| PATCH | `/shifts/:id` | — | শিফট আপডেট |
| DELETE | `/shifts/:id` | — | শিফট মুছে ফেলা |
| GET | `/schedules/weekly` | — | সাপ্তাহিক সূচি (employee × weekday grid) |
| GET | `/schedules/calendar` | `year`, `month` | মাসিক ক্যালেন্ডার সূচি |
| POST | `/schedules` | — | শিফট নির্ধারণ (employeeId + shiftId + weekday) |
| DELETE | `/schedules/:id` | — | নির্ধারণ সরানো |

**DB**: `shifts` table + `duty_schedules` table + `schedule_type` enum
**Schema**: `lib/db/src/schema/schedules.ts`
**Backend**: `artifacts/api-server/src/modules/schedules/`
**Frontend**: `/schedule` route → `Schedule.tsx` + `ShiftsTab`, `WeeklyScheduleTab`, `CalendarTab`

### Reports (`/api/reports`)
| Method | Path | Query Params | বিবরণ |
|---|---|---|---|
| GET | `/reports/sales` | `from`, `to` | দৈনিক বিক্রয় + KPI |
| GET | `/reports/inventory` | — | মজুদ রিপোর্ট |
| GET | `/reports/profit` | `from`, `to` | মুনাফা (revenue - cost, daily breakdown) |
| GET | `/reports/products` | `from`, `to` | পণ্য বিক্রয় (sorted by revenue) |
| GET | `/reports/due` | — | বকেয়া গ্রাহক (balance < 0) |
| GET | `/reports/staff` | `from`, `to` | কর্মী পারফরম্যান্স (GROUP BY userId) |

---

## 8. Feature Registry

> **Status:** ✅ সম্পূর্ণ | 🔧 আংশিক | 📋 পরিকল্পিত | ❌ নেই

### Core Infrastructure
| Feature | Status | Notes |
|---|---|---|
| pnpm monorepo setup | ✅ | api-server, dokan360, lib/* |
| PostgreSQL + Drizzle ORM | ✅ | সব table migrate হয়েছে |
| OpenAPI spec (`openapi.yaml`) | ✅ | সব endpoint define |
| orval codegen (hooks + zod) | ✅ | `pnpm codegen` |
| JWT auth (access + refresh token) | ✅ | bcrypt, secure |
| Express API server | ✅ | pino logging |
| React + Vite frontend | ✅ | BASE_PATH aware |

### User Wise Access Control ✅ (TASK 37 — সম্পূর্ণ)
| Feature | Status | Notes |
|---|---|---|
| `user_module_access` DB table | ✅ | shopId+userId unique, allowedModules JSON, dataRestriction |
| Backend CRUD (`/api/user-access`) | ✅ | GET list, GET/:userId, PUT/:userId, DELETE/:userId/reset |
| OpenAPI spec + orval codegen | ✅ | `listUserAccess`, `getUserAccess`, `updateUserAccess`, `resetUserAccess` hooks |
| `UserAccessTab` UI component | ✅ | `artifacts/dokan360/src/components/settings/UserAccessTab.tsx` |
| Settings → Roles & Permissions sub-tab | ✅ | `RolesAndAccessPanel` — দুটি sub-tab: Role Permissions + User Access |
| Bengali i18n | ✅ | `bn.json` + `en.json` — সব user-access key |

**Key files:**
- `lib/db/src/schema/user-access.ts` — Drizzle schema
- `artifacts/api-server/src/modules/user-access/user-access.service.ts` — service
- `artifacts/api-server/src/modules/user-access/user-access.router.ts` — router
- `artifacts/dokan360/src/components/settings/UserAccessTab.tsx` — UI
- `artifacts/dokan360/src/pages/Settings.tsx` — `RolesAndAccessPanel` wrapper

### Production API Configuration ✅ (TASK 5 — সম্পূর্ণ)
| Feature | Status | Notes |
|---|---|---|
| CORS setup | ✅ | `getAllowedOrigins()` — dev: allow all; prod: `CORS_ORIGINS` + `REPLIT_DOMAINS` auto-detect |
| CORS preflight cache | ✅ | `maxAge: 600` (10 min) — reduces preflight round-trips |
| CORS warning log | ✅ | Production-এ কোনো origin না থাকলে warn log |
| Production API URL (`VITE_API_URL`) | ✅ | `vite.config.ts` define → `main.tsx` `setBaseUrl()` — production deploy-এ API URL configure করা যায় |
| Secure headers (helmet) | ✅ | CSP, HSTS, referrer-policy, COEP disabled (Supabase compatible) |
| CSP Supabase domains | ✅ | `connectSrc` এ `https://*.supabase.co` + `wss://*.supabase.co` (Realtime WebSocket) |
| CSP dev vs prod | ✅ | `unsafe-eval` শুধু dev-এ; prod-এ tight CSP |
| `Permissions-Policy` header | ✅ | camera, mic, geo, payment, usb, interest-cohort সব বন্ধ |
| Trusted proxy config | ✅ | `TRUSTED_PROXY_COUNT` env var — default `1` (Replit/Nginx ready) |
| Replit domains auto-CORS | ✅ | `REPLIT_DOMAINS` env থেকে auto `https://` prefix + dedup |

**Key files:**
- `artifacts/api-server/src/config/env.ts` — `getAllowedOrigins()`, `getSupabaseHost()`, `TRUSTED_PROXY_COUNT`, `REPLIT_DOMAINS`
- `artifacts/api-server/src/app.ts` — CORS middleware, trust proxy setup, CORS warning log
- `artifacts/api-server/src/middleware/security-headers.middleware.ts` — helmet CSP (Supabase domains), `permissionsPolicyMiddleware`
- `artifacts/dokan360/vite.config.ts` — `VITE_API_URL` + `VITE_PUBLIC_URL` define, `html-public-url` transform plugin
- `artifacts/dokan360/src/main.tsx` — `setBaseUrl(VITE_API_URL)` on startup

### Deployment Scripts ✅ (TASK 6 — সম্পূর্ণ)
| Feature | Status | Notes |
|---|---|---|
| Replit Autoscale deployment | ✅ | `deployConfig()` — build: `pnpm run build`, run: `NODE_ENV=production PORT=8080 pnpm run start` |
| Express static file serving (prod) | ✅ | `app.ts` — production-এ Express `/` থেকে React frontend serve করে (single port 8080) |
| SPA catch-all route | ✅ | Non-API routes → `index.html` (Wouter client-side routing support) |
| Root `start` script | ✅ | `package.json` — `NODE_ENV=production PORT=8080 pnpm --filter @workspace/api-server run start` |
| Root `deploy` script | ✅ | `package.json` — `pnpm run build && pnpm run start` (build + start একসাথে) |
| Root `build:frontend` / `build:backend` | ✅ | আলাদা আলাদা build করার scripts |
| Root `db:push` / `db:generate` / `db:migrate` | ✅ | DB scripts root থেকে চালানো যায় |
| Vercel frontend deployment | ✅ | `vercel.json` — SPA rewrites, asset caching headers, env var refs |
| Drizzle migrations (production-safe) | ✅ | `lib/db/drizzle.config.ts` — `out: ./migrations` dir added |
| `generate` + `migrate` scripts | ✅ | `lib/db/package.json` — `drizzle-kit generate` + `drizzle-kit migrate` (prod-safe, vs `push` for dev) |
| `studio` script | ✅ | `lib/db/package.json` — `drizzle-kit studio` (DB GUI) |
| Production migration script | ✅ | `scripts/migrate-prod.sh` — Step 1: generate; Step 2: migrate; CI guard; confirmation prompt |
| STATIC_SERVE_DIR env var | ✅ | `app.ts` — override frontend static dir path if needed |

**Key files:**
- `artifacts/api-server/src/app.ts` — production static serving + SPA catch-all (after `/api` routes)
- `package.json` (root) — `start`, `deploy`, `build:frontend`, `build:backend`, `db:*` scripts
- `vercel.json` — Vercel SPA config, asset caching, env var mappings
- `lib/db/drizzle.config.ts` — `out: ./migrations` added
- `lib/db/package.json` — `generate`, `migrate`, `studio` scripts
- `scripts/migrate-prod.sh` — production migration with confirmation + CI guard

**Production deployment flow (Replit):**
1. Replit build step: `NODE_ENV=production pnpm run build` (typecheck + esbuild + Vite)
2. Replit run step: `NODE_ENV=production PORT=8080 pnpm run start` (Express serves API + frontend)
3. Single port `8080` → `/api/*` = API, everything else = React SPA

**Dev vs Production DB workflow:**
| Command | When | What it does |
|---|---|---|
| `pnpm db:push` | Development | Schema সরাসরি apply (no migration files) |
| `pnpm db:generate` | Before production deploy | SQL migration files তৈরি করে |
| `pnpm db:migrate` | Production | Migration files DB-তে apply করে (safe) |
| `bash scripts/migrate-prod.sh` | Production | generate + migrate একসাথে (with confirmation) |

**Vercel frontend-only deployment:**
- `VITE_API_URL` Vercel secret-এ production backend URL set করতে হবে
- `vercel.json` এর `YOUR_BACKEND_URL` replace করতে হবে

### SEO Basics ✅ (TASK 9 — সম্পূর্ণ)
| Feature | Status | Notes |
|---|---|---|
| Primary meta tags | ✅ | title, description, keywords, author, robots, theme-color |
| Canonical URL | ✅ | `<link rel="canonical">` — `__PUBLIC_URL__` token via `html-public-url` Vite plugin |
| Open Graph tags | ✅ | og:type, og:url, og:title, og:description, og:image (1200×630), og:locale (bn_BD), og:site_name |
| Twitter Card tags | ✅ | summary_large_image — title, description, image |
| Favicon system | ✅ | `favicon.svg` (brand purple #7240E7, store icon) + `apple-touch-icon.svg` + mask-icon |
| Web App Manifest | ✅ | `public/manifest.json` — name (বাংলা), short_name, theme/bg color, standalone display, shortcuts (POS + Dashboard) |
| Sitemap | ✅ | `public/sitemap.xml` — `/`, `/login`, `/register` with hreflang bn/en |
| robots.txt | ✅ | `public/robots.txt` — public pages allow, authenticated routes disallow, sitemap link |
| Bengali font (Hind Siliguri) | ✅ | Added to Google Fonts link in `index.html` (was missing) |
| HTML lang attribute | ✅ | `<html lang="bn">` — was `en`, now correct |
| PWA meta tags | ✅ | apple-mobile-web-app-*, mobile-web-app-capable, msapplication-TileColor |
| Public URL injection | ✅ | `VITE_PUBLIC_URL` env var → `__PUBLIC_URL__` in HTML via Vite `transformIndexHtml` plugin |

**Key files:**
- `artifacts/dokan360/index.html` — সব meta, OG, Twitter, favicon, manifest link
- `artifacts/dokan360/public/favicon.svg` — purple #7240E7 brand favicon (store icon)
- `artifacts/dokan360/public/apple-touch-icon.svg` — iOS home screen icon
- `artifacts/dokan360/public/manifest.json` — PWA manifest (বাংলা name, shortcuts)
- `artifacts/dokan360/public/sitemap.xml` — public page sitemap with hreflang
- `artifacts/dokan360/public/robots.txt` — crawl rules
- `artifacts/dokan360/vite.config.ts` — `html-public-url` plugin injects `VITE_PUBLIC_URL`

**Production setup:** `VITE_PUBLIC_URL` secret set করলে OG image, canonical URL, sitemap, robots.txt সব automatically correct হয়ে যাবে।

### UI Foundation
| Feature | Status | Files |
|---|---|---|
| CSS design tokens (light/dark) | ✅ | `index.css` |
| Bengali font (Hind Siliguri) | ✅ | `index.css` |
| Dark/Light/System theme toggle | ✅ | `ThemeContext.tsx`, `AppLayout.tsx` |
| Sidebar navigation (Bengali) | ✅ | `AppLayout.tsx` |
| Topbar (breadcrumb, bell, user menu) | ✅ | `AppLayout.tsx` |
| Login page | ✅ | `Login.tsx` |
| Register page | ✅ | `Register.tsx` |
| Auth context (JWT + refresh) | ✅ | `AuthContext.tsx` |
| Protected routes | ✅ | `App.tsx` |
| Toast notifications (বাংলা) | ✅ | shadcn Toaster |

### Premium Enterprise UI Upgrade ✅ (Phase 2 — সম্পূর্ণ)

> সমস্ত ৯টি page-এ Framer Motion animation, premium icon headers, এবং consistent design system প্রয়োগ করা হয়েছে।

#### Animation System
| Feature | Status | Files |
|---|---|---|
| Framer Motion animation library | ✅ | `src/lib/motion.ts` |
| `fadeInUp`, `fadeIn`, `scaleIn`, `staggerContainer`, `listItem`, `slideInLeft` variants | ✅ | `src/lib/motion.ts` |
| `spring`, `smoothTween`, `viewportOnce` presets | ✅ | `src/lib/motion.ts` |
| Reusable `PageHeader` component (animated) | ✅ | `src/components/ui/page-header.tsx` |
| Reusable `EmptyState` component (animated) | ✅ | `src/components/ui/empty-state.tsx` |

#### CSS Design System
| Feature | Status | Files |
|---|---|---|
| Premium CSS tokens (10px base radius, layered shadows, glass) | ✅ | `index.css` |
| 8-level shadow system (`shadow-2xs` → `shadow-2xl`) | ✅ | `index.css` |
| Scrollbar custom styles (minimal, 5px, rounded, desktop-only) | ✅ | `index.css` |
| `.glass` utility (backdrop-blur + saturate) | ✅ | `index.css` |
| `.pb-safe` / `.pt-safe` / `.px-safe` safe-area padding | ✅ | `index.css` |
| `.overscroll-contain` — prevent scroll-chaining in modals | ✅ | `index.css` |
| Richer dark/light palette (deep navy sidebar) | ✅ | `index.css` |
| `-webkit-tap-highlight-color: transparent` globally | ✅ | `index.css` |
| `touch-action: manipulation` on interactive elements | ✅ | `index.css` |
| `overscroll-behavior-y: none` on body (POS safe) | ✅ | `index.css` |

#### Responsive Optimization (Phase 3 — Mobile/Tablet/Desktop)
| Feature | Status | Files |
|---|---|---|
| POS ProductGrid — 88px min-height cards, 36px avatar, 15px price | ✅ | `ProductGrid.tsx` |
| POS ProductGrid — barcode input hidden on xs, visible sm+ | ✅ | `ProductGrid.tsx` |
| POS ProductGrid — `touch-manipulation` + `active:scale-[0.94]` | ✅ | `ProductGrid.tsx` |
| POS CartPanel — 40px (h-10 w-10) qty buttons (44px touch target) | ✅ | `CartPanel.tsx` |
| POS CartPanel — `touch-manipulation` on all controls | ✅ | `CartPanel.tsx` |
| POS CheckoutPanel — h-11 customer dropdown & inputs | ✅ | `CheckoutPanel.tsx` |
| POS CheckoutPanel — h-13 checkout button (thumb-friendly) | ✅ | `CheckoutPanel.tsx` |
| POS CheckoutPanel — payment method `py-2.5` taller buttons | ✅ | `CheckoutPanel.tsx` |
| POS CheckoutPanel — quick-pay chips `py-1.5 px-3` larger | ✅ | `CheckoutPanel.tsx` |
| POS InvoiceModal — `max-w-sm` fullwidth on mobile, h-12 actions | ✅ | `InvoiceModal.tsx` |
| POS InvoiceModal — accessibility: sr-only `<DialogTitle>` | ✅ | `InvoiceModal.tsx` |
| POS FAB — floating cart button on mobile (AnimatePresence spring) | ✅ | `POS.tsx` |
| POS Sheet — fullwidth on xs, 420px on sm+ | ✅ | `POS.tsx` |
| POS Layout — `h-[calc(100dvh-7rem)]` (dvh for mobile browsers) | ✅ | `POS.tsx` |
| ProductsTable — mobile card layout (< sm), table on sm+ | ✅ | `ProductsTable.tsx` |
| ProductsTable — h-10 w-10 action buttons on mobile | ✅ | `ProductsTable.tsx` |
| ProductsTable — delete dialog `max-w-sm rounded-2xl h-11 buttons` | ✅ | `ProductsTable.tsx` |
| InventoryTable — mobile card layout (< sm), table on sm+ | ✅ | `InventoryTable.tsx` |
| InventoryTable — h-10 w-10 action buttons on mobile | ✅ | `InventoryTable.tsx` |
| InventoryTable — h-10 search bar, `rounded-xl` filter | ✅ | `InventoryTable.tsx` |
| Sales — mobile card layout (< sm) with payment badge inline | ✅ | `Sales.tsx` |
| Sales — h-10 w-10 Eye button on mobile card rows | ✅ | `Sales.tsx` |
| Sales — h-11 print button in detail dialog | ✅ | `Sales.tsx` |
| Dashboard — KPI value `text-xl sm:text-[26px]` responsive | ✅ | `Dashboard.tsx` |
| Dashboard — chart wrapper `h-44 sm:h-56` responsive height | ✅ | `Dashboard.tsx` |
| Dashboard — card padding `p-4 sm:p-5`, spacing `space-y-5 sm:space-y-6` | ✅ | `Dashboard.tsx` |

#### Auth Pages
| Feature | Status | Files |
|---|---|---|
| Login — split-screen enterprise (brand panel + form) | ✅ | `Login.tsx` |
| Login — stagger mount animations + feature bullets | ✅ | `Login.tsx` |
| Login — pill submit button + demo box | ✅ | `Login.tsx` |
| Register — matching premium split style | ✅ | `Register.tsx` |

#### AppLayout
| Feature | Status | Files |
|---|---|---|
| Glass topbar (`bg-background/80 backdrop-blur-xl`) | ✅ | `AppLayout.tsx` |
| Sidebar active pill (`bg-primary/15`) + dot indicator | ✅ | `AppLayout.tsx` |
| Desktop user dropdown with avatar + shop name | ✅ | `AppLayout.tsx` |
| Mobile sheet side drawer (full nav) | ✅ | `AppLayout.tsx` |
| Mobile bottom nav (4 tabs + sheet trigger) | ✅ | `AppLayout.tsx` |
| Page transition animation (`key={location}` + `fadeIn`) | ✅ | `AppLayout.tsx` |
| Loading skeleton with pulse store icon | ✅ | `AppLayout.tsx` |

#### Dashboard
| Feature | Status | Files |
|---|---|---|
| Stagger-animated KPI cards (6) with gradient color wash | ✅ | `Dashboard.tsx` |
| Hover lift on KPI cards (`whileHover: { y: -2 }`) | ✅ | `Dashboard.tsx` |
| Area chart — gradient fill + custom Bengali tooltip | ✅ | `Dashboard.tsx` |
| Top products — animated progress bars + rank badges | ✅ | `Dashboard.tsx` |
| Recent sales — paid/due badges + stagger list | ✅ | `Dashboard.tsx` |
| Skeleton loading states throughout | ✅ | `Dashboard.tsx` |
| Live data badge (Zap icon) | ✅ | `Dashboard.tsx` |

#### Products Page
| Feature | Status | Files |
|---|---|---|
| Premium icon header (Package · violet) | ✅ | `Products.tsx` |
| `fadeInUp` + `staggerContainer` page animation | ✅ | `Products.tsx` |
| Rounded toolbar (search, filter, toggle) — `rounded-xl` | ✅ | `Products.tsx` |
| Stat pills with shadow (মোট পণ্য, কম মজুদ) | ✅ | `Products.tsx` |
| Styled tab list (`rounded-xl bg-muted/60`) | ✅ | `Products.tsx` |

#### POS Page
| Feature | Status | Files |
|---|---|---|
| Premium icon header (ShoppingCart · emerald) | ✅ | `POS.tsx` |
| Desktop cart panel `rounded-2xl` + responsive width | ✅ | `POS.tsx` |
| Page fade-in animation | ✅ | `POS.tsx` |

#### Inventory Page
| Feature | Status | Files |
|---|---|---|
| Premium icon header (Boxes · violet) | ✅ | `Inventory.tsx` |
| `staggerContainer` — header, banner, table sequential animate | ✅ | `Inventory.tsx` |

#### Customers Page
| Feature | Status | Files |
|---|---|---|
| Premium icon header (Users · blue) | ✅ | `Customers.tsx` |
| Stat cards with `whileHover` lift animation | ✅ | `Customers.tsx` |
| Customer card grid — `staggerContainer` + `fadeInUp` per card | ✅ | `Customers.tsx` |
| Empty state — `scaleIn` animation | ✅ | `Customers.tsx` |
| Due banner — `rounded-xl` + better styling | ✅ | `Customers.tsx` |

#### Sales Page
| Feature | Status | Files |
|---|---|---|
| Premium icon header (Receipt · orange) | ✅ | `Sales.tsx` |
| Payment method colored badges (4 colors) | ✅ | `Sales.tsx` |
| Table rows — staggered entry animation | ✅ | `Sales.tsx` |
| Eye button — group hover opacity | ✅ | `Sales.tsx` |
| Detail dialog — section labels, `useLocale` formatting, rounded | ✅ | `Sales.tsx` |

#### Reports Page
| Feature | Status | Files |
|---|---|---|
| Premium icon header (BarChart3 · cyan) | ✅ | `Reports.tsx` |
| Tab list `rounded-xl bg-muted/60` | ✅ | `Reports.tsx` |
| `staggerContainer` page animation | ✅ | `Reports.tsx` |

#### Employees Page ✅ (TASK 35 — সম্পূর্ণ)
| Feature | Status | Files |
|---|---|---|
| 4 stat cards (total / active / inactive / suspended) | ✅ | `Employees.tsx` |
| Status filter tabs (সব / সক্রিয় / নিষ্ক্রিয় / স্থগিত / পদত্যাগী) | ✅ | `Employees.tsx` |
| Search by name + phone | ✅ | `Employees.tsx` |
| Department & designation filter dropdowns | ✅ | `Employees.tsx` |
| Employee card grid (avatar initials, status badge, info chips) | ✅ | `Employees.tsx` |
| Add / Edit / Delete employee dialog (19+ fields) | ✅ | `Employees.tsx` |
| Document upload section in form dialog (photo, NID, CV, contract) | ✅ | `Employees.tsx` |
| `DocUploader` component — upload, view (signed URL), replace, remove | ✅ | `Employees.tsx` |
| Document badges on employee card (colored pills per doc type) | ✅ | `Employees.tsx` |
| Supabase Storage bucket `employee-docs` (private, 10 MB limit) | ✅ | psql + Supabase |
| Storage RLS — authenticated users: upload / read / update / delete | ✅ | Supabase policies |
| `nid_doc_url`, `cv_url`, `contract_url` columns on `employees` table | ✅ | psql migration |
| Signed URL generation (24 hr) for private document viewing | ✅ | `Employees.tsx` |
| Premium icon header (UserCog · indigo) | ✅ | `Employees.tsx` |
| Sidebar nav entry (কর্মী ব্যবস্থাপনা · UserCog icon) | ✅ | `AppLayout.tsx` |
| Bengali + English i18n translations (incl. docs.* keys) | ✅ | `bn.json`, `en.json` |
| DB schema: `employees` table + 3 pg enums | ✅ | `lib/db/src/schema/employees.ts` |
| Backend CRUD + stats API (incl. doc path fields) | ✅ | `modules/employees/` |

**UI Design System Summary:**
- **Radius**: `--radius: 0.625rem` (10px base) · cards `rounded-xl` · buttons `rounded-xl` · pills `rounded-full`
- **Font**: Hind Siliguri (Bengali) + Inter (Latin fallback)
- **Sidebar**: Deep navy (`hsl(222 45% 5–12%)`) · active = `bg-primary/15` + dot indicator
- **Topbar**: `bg-background/80 backdrop-blur-xl` glass effect · sticky `top-0 z-20`
- **Shadows**: 8 levels — `shadow-2xs` → `shadow-2xl` (layered soft)
- **Page headers**: Icon box (color per page) + title + subtitle + action button
- **Icon color coding**: Dashboard=primary · Products=primary · POS=emerald · Inventory=violet · Customers=blue · Sales=orange · Reports=cyan
- **Animation**: Framer Motion · `stagger 0.07s` · `duration 0.25–0.35s` · ease `[0.25,0.46,0.45,0.94]`

### i18n & Localization Module ✅ (Phase 2 — সম্পূর্ণ)
| Feature | Status | Files |
|---|---|---|
| i18next + react-i18next setup | ✅ | `src/i18n/config.ts` |
| Bengali locale file (সম্পূর্ণ) | ✅ | `src/i18n/locales/bn.json` |
| English locale file (সম্পূর্ণ) | ✅ | `src/i18n/locales/en.json` |
| LanguageContext (dynamic switching) | ✅ | `src/contexts/LanguageContext.tsx` |
| localStorage persistence | ✅ | `src/i18n/config.ts` (key: `dokan360_language`) |
| Bengali number formatting (`bn-BD`) | ✅ | `src/hooks/useLocale.ts` |
| Bengali currency formatting (৳) | ✅ | `src/hooks/useLocale.ts` |
| Bengali date formatting | ✅ | `src/hooks/useLocale.ts` |
| Bengali digit map (০-৯) | ✅ | `src/hooks/useLocale.ts` |
| Language switcher dropdown (topbar) | ✅ | `src/components/ui/language-switcher.tsx` |
| Language toggle compact (auth pages) | ✅ | `src/components/ui/language-switcher.tsx` |
| Language switcher full-width (mobile) | ✅ | `src/components/ui/language-switcher.tsx` |
| AppLayout i18n integrated | ✅ | `src/layouts/AppLayout.tsx` |
| Login page i18n integrated | ✅ | `src/pages/Login.tsx` |
| Register page i18n integrated | ✅ | `src/pages/Register.tsx` |
| Dashboard page i18n integrated | ✅ | `src/pages/Dashboard.tsx` |
| `document.documentElement.lang` set | ✅ | `LanguageContext.tsx` |
| RTL-safe (Bengali is LTR, handled) | ✅ | Architecture ready |

**Translation key namespaces:**
`nav` · `auth` · `dashboard` · `pos` · `products` · `inventory` · `customers` · `sales` · `reports` · `settings` · `common` · `theme` · `lang`

**i18n Architecture:**
```
src/i18n/
├── config.ts          ← i18next init, localStorage read/write
├── index.ts           ← re-exports
└── locales/
    ├── bn.json        ← Bengali (default) — 13 namespaces, 200+ keys
    └── en.json        ← English — পূর্ণ parity with bn.json

src/contexts/
└── LanguageContext.tsx ← locale state, setLocale(), toggleLocale(), isBengali

src/hooks/
└── useLocale.ts        ← formatCurrency(), formatNumber(), formatDate(), formatDateTime()

src/components/ui/
└── language-switcher.tsx ← LanguageSwitcher (dropdown), LanguageToggle (compact), LanguageSwitcherFull
```

### Dashboard Module
| Feature | Status | Files |
|---|---|---|
| KPI cards (৬টি — animated, gradient wash) | ✅ | `Dashboard.tsx` |
| Sales area chart (gradient fill, custom tooltip) | ✅ | `Dashboard.tsx` (recharts) |
| Bengali chart tooltip | ✅ | `Dashboard.tsx` |
| Top products (animated progress bar, rank badge) | ✅ | `Dashboard.tsx` |
| Recent sales list (paid/due badge, stagger) | ✅ | `Dashboard.tsx` |
| Skeleton loading states (all sections) | ✅ | `Dashboard.tsx` |
| Live data badge (Zap icon) | ✅ | `Dashboard.tsx` |

### Product Management Module
| Feature | Status | Files |
|---|---|---|
| পণ্য তালিকা (table + avatar) | ✅ | `ProductsTable.tsx` |
| পণ্য যোগ/সম্পাদনা (form dialog) | ✅ | `ProductFormDialog.tsx` |
| পণ্য নিষ্ক্রিয় (soft delete) | ✅ | `Products.tsx` |
| বারকোড + SKU field | ✅ | `ProductFormDialog.tsx` |
| মজুদ tracking + badge | ✅ | `ProductsTable.tsx` |
| Search + category filter | ✅ | `Products.tsx` |
| কম মজুদ filter toggle | ✅ | `Products.tsx` |
| Active filter badges | ✅ | `Products.tsx` |
| বিভাগ CRUD (inline edit) | ✅ | `CategoryManager.tsx` |
| Stats pills (মোট, কম মজুদ) | ✅ | `Products.tsx` |
| Premium UI upgrade (icon header, animations, rounded toolbar) | ✅ | `Products.tsx` |

### POS (Point of Sale) Module
| Feature | Status | Files |
|---|---|---|
| পণ্য search (text) | ✅ | `pos/ProductGrid.tsx` |
| বারকোড / SKU input (Enter-key scan) | ✅ | `pos/ProductGrid.tsx` |
| Real-time stock display + out-of-stock lock | ✅ | `pos/ProductGrid.tsx` |
| Cart CRUD (add/qty/remove/clear) | ✅ | `pos/useCart.ts`, `pos/CartPanel.tsx` |
| Max stock limit enforce in cart | ✅ | `pos/useCart.ts` |
| গ্রাহক select (searchable combobox) | ✅ | `pos/CheckoutPanel.tsx` |
| Payment method (নগদ/মোবাইল/কার্ড/বাকি) | ✅ | `pos/CheckoutPanel.tsx` |
| ছাড় (discount) input | ✅ | `pos/CheckoutPanel.tsx` |
| Partial payment + due calculation | ✅ | `pos/useCart.ts`, `pos/CheckoutPanel.tsx` |
| Quick-pay amount chips | ✅ | `pos/CheckoutPanel.tsx` |
| ফেরত (change) calculation | ✅ | `pos/useCart.ts` |
| Checkout → API → stock invalidate | ✅ | `POS.tsx` |
| Invoice success modal | ✅ | `pos/InvoiceModal.tsx` |
| Print invoice | ✅ | `pos/InvoiceModal.tsx` |
| Thermal receipt (58mm/80mm) | ✅ | `pos/ThermalReceipt.tsx` |
| Receipt print preview modal | ✅ | `pos/ReceiptModal.tsx` |
| QR code on receipt | ✅ | `qrcode.react` — encodes invoice number |
| @media print CSS — receipt-only print | ✅ | `index.css` — `#receipt-print-area` portal |
| Mobile responsive (Sheet cart) | ✅ | `POS.tsx` |
| Premium UI upgrade (emerald icon header, `rounded-2xl` cart panel) | ✅ | `POS.tsx` |
| Barcode scanner hardware support | ✅ | HID keyboard input via barcode input field |
| Invoice PDF export | ✅ | `window.print()` in `SaleDetailDialog` |

### Customer Management Module
| Feature | Status | Files |
|---|---|---|
| গ্রাহক তালিকা (card grid + search) | ✅ | `Customers.tsx`, `CustomerCard.tsx` |
| গ্রাহক যোগ/সম্পাদনা (form dialog) | ✅ | `CustomerFormDialog.tsx` |
| গ্রাহক মুছুন (ledger guard) | ✅ | `Customers.tsx` (DELETE /customers/:id) |
| নাম/ফোন দিয়ে সার্চ | ✅ | `Customers.tsx` |
| Stats bar (মোট গ্রাহক, বাকি, বিক্রয়) | ✅ | `Customers.tsx` |
| Ledger ইতিহাস dialog | ✅ | `CustomerLedgerDialog.tsx` |
| পরিশোধ গ্রহণ (payment collection) | ✅ | `CustomerPaymentDialog.tsx` |
| বাকি summary banner | ✅ | `Customers.tsx` |
| গ্রাহকের balance tracking | ✅ | DB: `customers.balance` |
| Running balance ledger | ✅ | DB: `ledger_entries.balance` |
| Premium UI upgrade (blue icon header, stagger grid, hover lift stats) | ✅ | `Customers.tsx` |

### Sales History Module
| Feature | Status | Files |
|---|---|---|
| বিক্রয় তালিকা (invoice/customer search) | ✅ | `Sales.tsx` |
| বিক্রয় বিস্তারিত dialog (items, totals, due) | ✅ | `Sales.tsx` (`SaleDetailDialog`) |
| Invoice view + print | ✅ | `Sales.tsx` |
| Premium UI upgrade (orange icon header, colored payment badges, stagger rows) | ✅ | `Sales.tsx` |
| Date range filter | ✅ | `Sales.tsx` — from/to date inputs → `useListSales` params |

### Inventory Module
| Feature | Status | Files |
|---|---|---|
| মজুদ তালিকা (table + stock bar + filter) | ✅ | `InventoryTable.tsx` |
| স্টক সার্চ (নাম / SKU) | ✅ | `InventoryTable.tsx` |
| মজুদ ফিল্টার (সব / কম / শেষ) | ✅ | `InventoryTable.tsx` |
| কম মজুদ সতর্কতা banner | ✅ | `LowStockBanner.tsx` |
| মজুদ সমন্বয় dialog (Stock IN/OUT/Adjustment) | ✅ | `StockAdjustDialog.tsx` |
| Preset qty chips (quick pick) | ✅ | `StockAdjustDialog.tsx` |
| Real-time preview (নতুন মজুদ গণনা) | ✅ | `StockAdjustDialog.tsx` |
| সমন্বয় ইতিহাস drawer (per product) | ✅ | `StockHistoryDrawer.tsx` |
| Premium UI upgrade (violet icon header, staggerContainer animation) | ✅ | `Inventory.tsx` |
| Supplier tracking | 📋 | DB schema + API endpoint প্রয়োজন (deferred) |

### Reports Module
| Feature | Status | Files |
|---|---|---|
| দৈনিক বিক্রয় রিপোর্ট (date range + chart + table) | ✅ | `DailySalesReport.tsx` |
| মুনাফা রিপোর্ট (revenue vs cost, margin, chart) | ✅ | `ProfitReport.tsx` |
| পণ্য বিক্রয় রিপোর্ট (top products, horizontal bar) | ✅ | `ProductReport.tsx` |
| বাকি রিপোর্ট (customers with due, bar chart) | ✅ | `DueReport.tsx` |
| কর্মী রিপোর্ট (staff performance, chart) | ✅ | `StaffReport.tsx` |
| PDF export (print window with styled HTML) | ✅ | `ExportToolbar.tsx` |
| Excel export (SheetJS xlsx) | ✅ | `ExportToolbar.tsx` |
| Date range picker (presets: আজ/৭ দিন/এই মাস/গত মাস) | ✅ | `DateRangePicker.tsx` |
| KPI cards (per report) | ✅ | `ReportKpiCard.tsx` |
| Inventory report | ✅ | existing `/reports/inventory` |
| Premium UI upgrade (cyan icon header, rounded tabs, stagger animation) | ✅ | `Reports.tsx` |

### Settings Module
| Feature | Status | Files |
|---|---|---|
| দোকানের তথ্য সম্পাদনা | ✅ | `Settings.tsx` (GET/PATCH /shop) — admin only |
| User management (invite/role) | ✅ | `Settings.tsx` — invite, role, deactivate |
| Theme preference | ✅ | `ThemeContext.tsx` |

---

## 9. Page & Component Map

### Pages (`artifacts/dokan360/src/pages/`)

| File | Route | Module |
|---|---|---|
| `Login.tsx` | `/login` | Auth |
| `Register.tsx` | `/register` | Auth |
| `Dashboard.tsx` | `/` | Dashboard |
| `POS.tsx` | `/pos` | POS |
| `Products.tsx` | `/products` | Products |
| `Inventory.tsx` | `/inventory` | Inventory |
| `Customers.tsx` | `/customers` | Customers |
| `Sales.tsx` | `/sales` | Sales |
| `Reports.tsx` | `/reports` | Reports |
| `Settings.tsx` | `/settings` | Settings |
| `not-found.tsx` | `*` | — |

### Components (`artifacts/dokan360/src/components/`)

| File | কাজ |
|---|---|
| `products/ProductFormDialog.tsx` | পণ্য যোগ/সম্পাদনা dialog (zod form) |
| `products/ProductsTable.tsx` | পণ্য table (avatar, stock badge, actions) |
| `products/CategoryManager.tsx` | বিভাগ CRUD (inline edit) |
| `pos/useCart.ts` | Cart state hook (items, totals, due, change) |
| `pos/ProductGrid.tsx` | POS product grid + text search + barcode input |
| `pos/CartPanel.tsx` | Cart items list + quantity controls |
| `pos/CheckoutPanel.tsx` | Customer combobox, payment, discount, checkout |
| `pos/InvoiceModal.tsx` | Sale success dialog + print |
| `inventory/LowStockBanner.tsx` | কম মজুদ সতর্কতা banner (progress bars, quick adjust) |
| `inventory/StockAdjustDialog.tsx` | Stock IN/OUT/Adjustment dialog (preset chips, preview) |
| `inventory/InventoryTable.tsx` | মজুদ table (stock bars, search, filter, hover actions) |
| `inventory/StockHistoryDrawer.tsx` | প্রতিটি পণ্যের সমন্বয় ইতিহাস sheet |
| `customers/CustomerCard.tsx` | গ্রাহক card (avatar, balance badge, dropdown actions) |
| `customers/CustomerFormDialog.tsx` | গ্রাহক তৈরি/সম্পাদনা dialog (zod form) |
| `customers/CustomerLedgerDialog.tsx` | Ledger ইতিহাস dialog (running balance, payment trigger) |
| `customers/CustomerPaymentDialog.tsx` | পরিশোধ গ্রহণ dialog (quick-fill due, note field) |
| `reports/DateRangePicker.tsx` | তারিখ পিকার (presets + manual inputs) |
| `reports/ExportToolbar.tsx` | PDF + Excel export buttons (SheetJS) |
| `reports/ReportKpiCard.tsx` | KPI card (icon, label, value, variant) |
| `reports/DailySalesReport.tsx` | দৈনিক বিক্রয় — KPI + bar chart + table |
| `reports/ProfitReport.tsx` | মুনাফা — revenue vs cost composed chart + table |
| `reports/ProductReport.tsx` | পণ্য — horizontal bar + ranked table |
| `reports/DueReport.tsx` | বাকি — customer due bar chart + table |
| `reports/StaffReport.tsx` | কর্মী — sales by staff bar chart + table |
| `ui/*` | shadcn/ui primitives (Button, Input, Dialog, ...) |

### Layouts & Contexts

| File | কাজ |
|---|---|
| `layouts/AppLayout.tsx` | Sidebar (desktop) + Topbar + Mobile Bottom Nav (4 tabs + full menu sheet) |
| `contexts/AuthContext.tsx` | JWT auth state, login/logout, token refresh |
| `contexts/ThemeContext.tsx` | next-themes wrapper (light/dark/system) |
| `contexts/LanguageContext.tsx` | i18n locale state, setLocale(), toggleLocale(), isBengali |

---

## 10. Setup & Run Guide

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL (Replit managed — auto via DATABASE_URL)

### Environment Variables

```env
# API Server (Replit secrets-এ set করুন — .env file-এ নয়)
DATABASE_URL=postgresql://...        # Replit-managed Postgres (auto-provisioned)
SUPABASE_DATABASE_URL=postgresql://  # optional — Supabase হলে এটি set করুন (priority নেয়)
SESSION_SECRET=your-secret-key       # min 16 chars (prod: min 32 chars)
PORT=8080

# Frontend (Replit userenv-এ set — .replit-এ defined)
PORT=5000
BASE_PATH=/
NODE_ENV=development
```

> **Note:** `SUPABASE_DATABASE_URL` takes priority over `DATABASE_URL`. SSL is auto-enabled when the hostname contains `supabase.com`. Replit-এ দুটোই Replit Secrets-এ store করুন।

### First-time Setup

```bash
# 1. Dependencies install
pnpm install

# 2. Database migrate
pnpm --filter @workspace/db run push

# 3. (Optional) Seed data — login with demo@dokan360.com / demo123
```

### Development

```bash
# API Server (port 8080)
PORT=8080 pnpm --filter @workspace/api-server run dev

# Frontend (port 5000 — managed by artifact system)
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/dokan360 run dev

# Regenerate API hooks after openapi.yaml changes
pnpm --filter @workspace/api-spec run codegen
```

### Adding a New Feature (Workflow)

```
1. lib/api-spec/openapi.yaml → নতুন endpoint/schema যোগ করুন
2. pnpm run --filter @workspace/api-spec codegen → hooks regenerate
3. artifacts/api-server/src/modules/<module>/<module>.router.ts → thin HTTP handler
4. artifacts/api-server/src/modules/<module>/<module>.service.ts → business logic
5. artifacts/dokan360/src/pages/ বা components/ → UI তৈরি করুন
6. BLUEPRINT.md → Feature Registry-তে status আপডেট করুন
```

---

## 12. Replit-Specific Configuration (CRITICAL)

### Port Allocation

| Workflow | Port (internal) | External Port | চালায় কে |
|---|---|---|---|
| `Start application` | **5000** | :80 (webview / canvas) | Replit workflow |
| `Backend` | **8080** | :8080 | Replit workflow |

### Port Mappings

```toml
[[ports]]
localPort = 5000
externalPort = 80   # webview / canvas / preview pane

[[ports]]
localPort = 8080
externalPort = 8080
```

### URL Access

- **Preview tab / canvas / webview** → `Start application` workflow (port 5000, external :80)
- **API** → `Backend` workflow (port 8080, internal only — accessed via Vite proxy)
- Vite proxy: `/api/*` → `localhost:8080` (configured in `vite.config.ts`)

### Port Conflict এড়ানোর নিয়ম

1. **কখনো** port **5000** বা **8080** অন্য কোনো workflow-এ ব্যবহার করবে না
2. দুটি workflows চলছে: `Start application` (port 5000) এবং `Backend` (port 8080)
3. নতুন workflow দরকার হলে: `3001, 5173, 6000, 8000, 8008, 8099, 9000` এর মধ্যে বেছে নাও
4. যদি workflow crash করে ("EADDRINUSE" error), restart order:
   ```
   Backend → Start application
   ```

### Vite Configuration Requirements

`artifacts/dokan360/vite.config.ts`-এ এই settings থাকা MUST:
```typescript
server: {
  host: "0.0.0.0",       // Replit proxy-র জন্য জরুরি
  allowedHosts: true,     // সব Replit domain allow করে
  headers: { "Cache-Control": "no-store" },  // Proxy caching এড়ায়
  proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } }
}
```

### `vite-proxy.ts` (API Server)

`artifacts/api-server/src/lib/vite-proxy.ts` — Express server থেকে Vite dev server-এ non-API request forward করার জন্য তৈরি হয়েছিল। Backend port 8080 থেকে `/api` ছাড়া সব request Vite port 5000-এ forward করে।

---

## 11. Conventions & Rules

### ফাইল নামকরণ
- Pages: `PascalCase.tsx` (e.g., `Products.tsx`)
- Components: `PascalCase.tsx` (e.g., `ProductsTable.tsx`)
- Hooks: `camelCase.ts` (e.g., `use-toast.ts`)
- Contexts: `PascalCase.tsx` (e.g., `AuthContext.tsx`)

### API Client
- কখনো সরাসরি `fetch` লিখবেন না — সব সময় orval-generated hooks ব্যবহার করুন
- `useListProducts`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`
- `useListCategories`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory`
- Cache invalidate: `qc.invalidateQueries({ queryKey: getListProductsQueryKey() })`

### TypeScript
- `any` ব্যবহার করবেন না — সব সময় explicit type দিন
- API types: `import type { Product, Category } from "@workspace/api-client-react"`
- Generated types কখনো manually edit করবেন না

### TypeScript Null Safety (Critical)
- Zod-parsed optional fields যেমন `note?`, `reason?` সাধারণত `string | null | undefined` হয়
- Service function signature যদি `string | undefined` expect করে, তাহলে `?? undefined` দিয়ে null strip করতে হবে:
  ```ts
  // ✅ সঠিক
  customerService.collectPayment(..., parsed.data.note ?? undefined)
  inventoryService.adjustInventory(..., reason ?? undefined)
  ```
- Drizzle insert-এ `notNull()` column-এ কখনো `...spread` করবেন না যদি object-এ `null` থাকতে পারে — explicit values object লিখুন:
  ```ts
  // ❌ ভুল — unit: string | null ← notNull() column crash করবে
  db.insert(productsTable).values({ ...data, shopId })
  // ✅ সঠিক — null → undefined convert করুন
  db.insert(productsTable).values({
    shopId,
    nameBn: data.nameBn,
    unit: data.unit ?? undefined,   // notNull() column, null allowed as undefined (DB default applies)
    costPrice: data.costPrice != null ? String(data.costPrice) : undefined,
  })
  ```

### Bengali UI Rules
- সব button, label, placeholder, toast → বাংলায়
- Error message → বাংলায়
- Currency: `৳${Number(price).toLocaleString()}` বা `৳{price.toLocaleString('bn-BD')}`
- Date: `.toLocaleDateString('bn-BD', { ... })`

### Soft Delete
- পণ্য "মুছলে" আসলে `isActive = false` হয় — data হারায় না
- বিক্রয়ের `productNameBn` snapshot হিসেবে রাখা হয় (product delete হলেও history থাকে)

### Theme
- সব color CSS variable দিয়ে — hardcoded color class ব্যবহার করবেন না
- `bg-primary`, `text-muted-foreground`, `border-border` — এই pattern অনুসরণ করুন
- Dark mode test করুন — দুটো theme-এই দেখতে হবে

---

## 13. Architecture Decisions

### ADR-001 — PostgreSQL Host Strategy

**Status:** ✅ Adopted (TASK 1, updated post-Replit migration)

**Context:** The app supports two PostgreSQL providers. Priority order: `SUPABASE_DATABASE_URL` → `DATABASE_URL`. The DB client in `lib/db/src/index.ts` auto-detects which to use.

**Current Setup (Replit environment):**
- `DATABASE_URL` — Replit-managed PostgreSQL (set as Replit secret, available in dev + prod)
- `SUPABASE_DATABASE_URL` — optional Supabase connection (takes priority if set)
- SSL is auto-enabled when hostname contains `supabase.com`
- Schema managed via `drizzle-kit push` — no migration files needed at this stage

---

### ADR-002 — Drizzle ORM (Do NOT migrate to Prisma yet)

**Status:** ✅ Adopted (TASK 2)

**Context:** The existing schema, business logic, and all route handlers are built on Drizzle ORM. Migrating to Prisma would require:
- Full schema rewrite (Prisma DSL vs Drizzle's TypeScript-native schema)
- All service queries rewritten
- New codegen setup (Prisma client vs drizzle-zod)
- High risk of regressions with minimal business value

**Decision:** Keep Drizzle ORM. The ORM layer is isolated in `lib/db` — it is replaceable in the future when the team is larger and the system is at enterprise scale.

**Future Prisma Migration Trigger Conditions:**
- Engineering team grows to 5+ developers
- Current system scales beyond 50,000 daily active shops
- Drizzle ORM becomes a specific bottleneck (N+1 queries, type safety gaps)

**Future migration strategy (when conditions are met):**
```
1. Create lib/db-prisma/ alongside existing lib/db/
2. Migrate schema table by table (data integrity preserved)
3. Migrate services module by module (start with least critical)
4. Run dual-write period for verification
5. Remove lib/db/ once all services migrated
```

---

### ADR-004 — Centralized Environment Config Module (TASK 1)

**Status:** ✅ Adopted

**Context:** Environment variables were accessed directly via `process.env.*` scattered across multiple files (`index.ts`, `app.ts`, `logger.ts`, `auth.utils.ts`). No validation at startup → silent crashes from missing/invalid env vars in production.

**Decision:** Single `src/config/env.ts` module that:
1. Defines a Zod schema for all environment variables
2. Validates at process startup — fails fast with a clear error message if any var is missing or invalid
3. Exports a typed, immutable `env` object — no direct `process.env` access anywhere else
4. Enforces production-only guards (SESSION_SECRET min 32 chars, no insecure defaults)
5. Exports `isProduction`, `isDevelopment`, `isTest` helpers used project-wide

**Variables validated:**

| Variable | Type | Default | Production rule |
|---|---|---|---|
| `NODE_ENV` | `development\|production\|test` | `development` | — |
| `PORT` | `number` | required | — |
| `DATABASE_URL` | `string?` | — | one of DB URLs required |
| `SUPABASE_DATABASE_URL` | `string?` | — | one of DB URLs required |
| `SESSION_SECRET` | `string (min 16)` | required | min 32, no defaults |
| `LOG_LEVEL` | `fatal\|error\|warn\|info\|debug\|trace` | `info` | — |
| `CORS_ORIGINS` | `string?` | — | required in production |
| `TRUSTED_PROXY_COUNT` | `number (≥0)` | `0` | — |

**Files updated:**
- `src/config/env.ts` — NEW (central config)
- `src/common/logger.ts` — uses `env.LOG_LEVEL`, `isProduction`
- `src/utils/auth.utils.ts` — uses `env.SESSION_SECRET` (no fallback default)
- `src/index.ts` — uses `env.PORT`, `isDevelopment`
- `src/app.ts` — uses `getAllowedOrigins()`, `isDevelopment`, `isProduction`

**Also added:**
- `.env.example` — documents all required env vars with explanations
- `trust proxy` set to `1` in production (Replit/Vercel reverse proxy)
- Secrets redacted in pino logs: `*.password`, `*.token`, `*.accessToken`, etc.
- `express.json({ limit: "1mb" })` — body size capped
- `credentials: true` on CORS — required for cookie-based refresh token delivery

---

### ADR-003 — Clean Architecture Module Structure

**Status:** ✅ Adopted (TASK 2, 3)

**Decision:** Each feature module owns its own router + service. Shared utilities are in `common/` and `utils/`.

**Module boundaries:**
- `router.ts` never imports `db` directly — only calls service functions
- `service.ts` never imports `Request`/`Response` — only returns plain objects or throws `AppError`
- `common/errors.ts` is the only place error classes are defined
- `utils/query.utils.ts` is the only place shared DB query helpers live

---

## 14. RBAC Security Standards

**Status:** ✅ Implemented (TASK 7)

### Roles

| Role | ক্ষমতা |
|---|---|
| `admin` | সব কিছু — users invite/manage, all data access |
| `seller` | POS + products + customers + inventory + reports read |
| `viewer` | Dashboard + reports read only |

### Middleware Chain

```
requireAuth          → JWT verify → attach req.user
requireRole("admin") → check user.role
getShopId            → extract req.user.shopId
```

### Security Standards
- Passwords: bcrypt (cost factor 10)
- Access token: 15-minute expiry (short-lived)
- Refresh token: 30-day expiry, hashed in DB, revocable
- All shop data isolated by `shopId` (multi-tenant row-level isolation)
- Refresh tokens stored as bcrypt hashes — raw token never persisted
- SQL injection prevention: Drizzle ORM parameterized queries only
- Input validation: Zod schemas (api-zod) on all incoming requests

---

## 15. Performance Standards (TASK 8)

**Targets:**
- API response: < 300ms (95th percentile)
- POS checkout flow: < 1s end-to-end
- Dashboard load: < 2s (6 KPI cards + chart + top products)

**Implemented:**
- React Query caching — dashboard data cached 30s, stale-while-revalidate
- Drizzle ORM `.limit()` on all list queries — prevents unbounded result sets
- Shared `getPaginationOptions()` in `common/pagination.ts` — consistent limits (max 200)
- Database indexes: `shopId` FKs on all major tables (enforced by Drizzle relations)
- pino structured logging — no sync I/O in request path

**Shared Query Utilities (`utils/query.utils.ts`):**
- `buildDateRange(column, from, to)` — shared across reports, sales, dashboard
- `buildSearch(column, term)` — ILIKE search, used by products, customers
- `parseIntId(value)` — safe URL param parsing

**Future optimizations (Phase 2):**
- Redis caching for dashboard summary (TTL: 60s)
- DB query explain analysis for slow queries
- Cursor-based pagination for large datasets (> 10,000 rows)
- Connection pooling tuning (Supabase session pooler max connections)

---

## 16. Offline-Ready POS Foundation (TASK 11)

**Status:** 🏗️ Architecture prepared — NOT yet implemented

**Phase 1 (current):** Online-only POS. All sales require API connectivity.

**Phase 2 (future — Offline POS):**

Architecture plan:
```
Browser (IndexedDB)
    │
    ▼
Service Worker (intercept fetch)
    │
    ▼
Sync Queue (pending transactions)
    │ on reconnect
    ▼
/api/sync endpoint (POST batch)
    │
    ▼
Server: processSyncQueue() in modules/sync/sync.service.ts
    │ conflict resolution: server timestamp wins
    ▼
Ack → client clears queue
```

**Conflict Resolution Strategy:**
- `sale` records: server-assigned `invoiceNumber` — no conflict possible
- `inventory` adjustments: delta-based (not absolute) — safe to merge
- `customer` balance: server-side recalculation after sync

**Service stub:** `src/modules/sync/sync.service.ts`
- `processSyncQueue(shopId)` — will process queued offline transactions
- `getStateDelta(shopId, since)` — will return changed records since timestamp

---

## 17. AI-Ready Architecture (TASK 12)

**Status:** 🏗️ Architecture prepared — NOT yet implemented

**Phase 3 (future — AI features):**

Planned AI module: `src/modules/ai/ai.service.ts`

| Feature | কাজ | Implementation Plan |
|---|---|---|
| Sales Forecast | আগামী ৭/৩০ দিনের বিক্রয় পূর্বাভাস | Time-series (historical data → regression) |
| Reorder Suggestions | কোন পণ্য কখন কতটুকু অর্ডার দেবেন | Inventory velocity + min stock level |
| Bengali AI Assistant | প্রাকৃতিক ভাষায় দোকানের প্রশ্ন | OpenAI GPT-4o / Gemini Pro (Replit AI Integrations) |
| Anomaly Detection | অস্বাভাবিক বিক্রয় pattern সনাক্ত | Statistical outlier detection |
| Smart Discount | মজুদের বয়স অনুযায়ী ছাড়ের পরামর্শ | Inventory age + demand analysis |

**Integration stack (when implemented):**
- Replit AI Integrations proxy (no API key management needed)
- `lib/ai-integrations-openai` or `lib/ai-integrations-gemini` skill
- Streaming responses for Bengali assistant (SSE)

**Service stubs:** `src/modules/ai/ai.service.ts`
- `getSalesForecast(shopId, days)` — returns `SalesForecast[]`
- `getReorderSuggestions(shopId)` — returns `ReorderSuggestion[]`
- `getBusinessInsights(shopId)` — returns Bengali `AiInsight[]`

---

## 18. SaaS Scaling Roadmap

### Current Stage (MVP)
```
Single Express server
↓
Supabase PostgreSQL (Session pooler)
↓
Drizzle ORM
↓
Replit hosting
```

### Phase 2 — Growth (100–1,000 shops)
- Add Redis for session/cache (`ioredis`)
- Rate limiting per shop (`express-rate-limit` + Redis store)
- Background job queue (`bull` / `pg-boss`) for invoice generation, reports
- Webhook system for integrations (bKash, Nagad payment callbacks)
- S3-compatible storage for invoice PDF archives (Replit Object Storage)

### Phase 3 — Scale (1,000–10,000 shops)
- Horizontal scaling (multiple Express instances behind load balancer)
- NestJS migration for better DI, microservice readiness
- Read replicas for report queries (Supabase read replicas)
- Event-driven architecture (`CQRS`) for sales → inventory sync
- Multi-region deployment (Supabase supports multiple regions)

### Phase 4 — Enterprise (10,000+ shops)
- Microservices: auth, billing, POS, analytics split into separate services
- Prisma ORM migration (see ADR-002)
- Kubernetes orchestration
- Bengali AI assistant (Phase 3 AI features go live)
- Multi-currency support (USD, EUR alongside BDT)

---

---

## 19. Build Optimization (TASK 7)

**Status:** ✅ Complete

### Lazy Loading — `artifacts/dokan360/src/App.tsx`

All 11 page-level components are loaded via `React.lazy()`. Each page becomes a separate JS chunk downloaded only when first navigated to.

```
App.tsx (entry)
  ├── AuthGate          (static — tiny, needed before any route renders)
  ├── AppLayout         (static — sidebar + topbar, always present when logged in)
  └── Pages (lazy chunks, downloaded on demand):
        Login, Register, NotFound
        Dashboard, POS, Products, Inventory
        Customers, Sales, Reports, Settings
```

**Suspense placement:** inside `ProtectedRoute` (wraps the page, not the layout). The sidebar and topbar remain visible while the page chunk downloads — only the content area shows `<PageLoader />`.

---

### Vendor Code Splitting — `artifacts/dokan360/vite.config.ts`

`manualChunks` splits third-party code into stable, separately-cacheable files. Returning users only re-download chunks that changed between releases.

| Chunk | Contents | Why separate |
|---|---|---|
| `chunk-react` | react, react-dom | Core — always needed, rarely changes |
| `chunk-radix` | @radix-ui/* | Large UI primitive set |
| `chunk-charts` | recharts + d3-* | Heavy — only needed on Dashboard/Reports |
| `chunk-motion` | framer-motion | Animation — medium, rarely changes |
| `chunk-supabase` | @supabase/supabase-js | Auth + Realtime client |
| `chunk-query` | @tanstack/react-query | Data fetching layer |
| `chunk-xlsx` | xlsx | Excel export — large, only needed on Reports |
| `chunk-i18n` | i18next, react-i18next | Internationalisation |
| `chunk-icons` | lucide-react | Icon set (tree-shaken by Rollup) |
| `chunk-vendor` | zod, wouter, clsx, etc. | Everything else |

---

### Build Config — `artifacts/dokan360/vite.config.ts`

| Option | Value | Effect |
|---|---|---|
| `target` | `es2020` | Modern syntax — no legacy transforms, smaller output |
| `cssCodeSplit` | `true` | Per-chunk CSS — only load styles for current page |
| `reportCompressedSize` | `false` | Skips gz size report — faster build output |
| `chunkSizeWarningLimit` | `1500` kB | Raised to account for recharts + radix legitimately exceeding default |

**Organised asset output paths:**
```
dist/public/
  assets/
    js/   [name]-[hash].js       ← JS chunks
    css/  [name]-[hash].css      ← CSS per-chunk
    img/  [name]-[hash].(svg…)   ← images / icons
```

---

### Runtime Compression — `artifacts/api-server/src/app.ts`

Express `compression` middleware compresses all API responses and static files served in production.

| Config | Value |
|---|---|
| Package | `compression` (npm) |
| Level | 6 (CPU/ratio balance, 1–9 scale) |
| Threshold | 1 kB (skip tiny responses) |
| Placement | After security headers, before logger |
| SSE safety | Filter skips `text/event-stream` responses |

**Impact in production:** All JSON API responses, HTML, CSS, and JS assets are gzip-compressed before transmission. The long-lived `Cache-Control: max-age=31536000` on hashed static assets means the compressed bytes are stored in the browser cache after the first visit.

---

## 20. Error Monitoring Architecture (TASK 8)

**Status:** ✅ Complete  
**Sentry status:** Plug-in ready — set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) to activate.

---

### Design Principles

| Principle | বিবরণ |
|---|---|
| **Zero Sentry coupling at build time** | Sentry is dynamically imported only when DSN is present — bundle size unchanged without it |
| **Single capture surface** | সব error একটাই module দিয়ে যায় — `errorReporter.captureError()` |
| **Log-first fallback** | DSN ছাড়া → pino (backend) / console (frontend dev) → production-এ silent |
| **4xx vs 5xx split** | Client errors (4xx) NOT reported to Sentry — only server-side bugs (5xx) + uncaught exceptions |
| **Context propagation** | requestId, userId, shopId, role সব event-এ attached |

---

### Backend Error Reporter — `artifacts/api-server/src/common/error-reporter.ts`

```
Server Startup
    │
    ▼
errorReporter.init()
    │  SENTRY_DSN set? → dynamic import @sentry/node → Sentry.init()
    │  No DSN?         → log-only mode (pino)
    ▼
HTTP Request → Error thrown
    │
    ▼
error.middleware.ts — errorHandler()
    │  AppError 5xx   → errorReporter.captureError(err, { requestId, userId, shopId, role, method, url })
    │  Unhandled err  → errorReporter.captureError(err, context)
    │  AppError 4xx   → warn log only (not reported)
    ▼
process.on('uncaughtException')     → errorReporter.captureFatal(err, "uncaughtException")
process.on('unhandledRejection')    → errorReporter.captureFatal(err, "unhandledRejection")
```

| Method | কাজ |
|---|---|
| `init()` | Server startup-এ একবার call করো — Sentry init বা log-only mode |
| `captureError(err, ctx)` | Error capture — Sentry active হলে Sentry-তে, নইলে pino error log |
| `captureMessage(msg, level, ctx)` | Message capture — warning, info, debug level |
| `captureFatal(err, origin)` | Process-level fatal error — uncaughtException / unhandledRejection |

**Activation:**
```bash
# 1. Install Sentry SDK (optional, only when ready)
pnpm --filter @workspace/api-server add @sentry/node

# 2. Set SENTRY_DSN secret in Replit
# Secrets → SENTRY_DSN = https://xxx@oXXX.ingest.sentry.io/YYY

# 3. Restart Backend workflow — Sentry auto-activates
```

**Key files:**
- `artifacts/api-server/src/common/error-reporter.ts` — ErrorReporter class (singleton)
- `artifacts/api-server/src/config/env.ts` — `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` optional env vars
- `artifacts/api-server/src/middleware/error.middleware.ts` — 5xx errors → `errorReporter.captureError()`
- `artifacts/api-server/src/index.ts` — `errorReporter.init()` + global process error handlers

---

### Frontend Error Reporter — `artifacts/dokan360/src/lib/error-reporter.ts`

```
App startup (main.tsx)
    │
    ▼
errorReporter.init()
    │  VITE_SENTRY_DSN set? → dynamic import @sentry/react → Sentry.init()
    │  No DSN?              → dev: console.error / prod: silent
    ▼
React component throws error
    │
    ▼
ErrorBoundary.componentDidCatch()
    │  errorReporter.captureError(error, { component, page })
    ▼
Bengali fallback UI ("কিছু একটা ভুল হয়েছে")
    │  "আবার চেষ্টা করুন" button → boundary resets
    │  "পেইজ রিফ্রেশ করুন" button → window.location.reload()
```

| Method | কাজ |
|---|---|
| `init()` | main.tsx-এ একবার call — Sentry init বা log-only mode |
| `setUser(user)` | Login-এ user context set, logout-এ null |
| `captureError(err, ctx)` | Render error capture |
| `captureMessage(msg, level, ctx)` | Informational capture |

**Activation:**
```bash
# 1. Install Sentry React SDK (optional)
pnpm --filter @workspace/dokan360 add @sentry/react

# 2. Set secrets in Replit
# VITE_SENTRY_DSN = https://xxx@oXXX.ingest.sentry.io/YYY

# 3. Restart "Start application" workflow
```

**Key files:**
- `artifacts/dokan360/src/lib/error-reporter.ts` — FrontendErrorReporter class (singleton)
- `artifacts/dokan360/src/components/ui/ErrorBoundary.tsx` — React Error Boundary (Bengali fallback UI)
- `artifacts/dokan360/src/App.tsx` — Double ErrorBoundary wrap (outer: provider errors, inner: router/page errors)
- `artifacts/dokan360/src/main.tsx` — `errorReporter.init()` on startup

---

### Feature Registry Update

| Feature | Status | Notes |
|---|---|---|
| Backend ErrorReporter (singleton) | ✅ | `common/error-reporter.ts` — Sentry-compatible interface |
| Sentry backend DSN config | ✅ | `env.ts` — `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` optional |
| 5xx error capture in errorHandler | ✅ | `error.middleware.ts` — all 5xx + unhandled → errorReporter |
| Global process error handlers | ✅ | `index.ts` — `uncaughtException` + `unhandledRejection` → captureFatal |
| Graceful SIGTERM shutdown | ✅ | `index.ts` — server.close() + 10s force-exit fallback |
| Frontend ErrorReporter (singleton) | ✅ | `lib/error-reporter.ts` — Sentry-compatible interface |
| Sentry frontend DSN config | ✅ | `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `VITE_SENTRY_RELEASE` via Vite env |
| React Error Boundary | ✅ | `components/ui/ErrorBoundary.tsx` — Bengali fallback UI + retry button |
| App-level ErrorBoundary wrapping | ✅ | `App.tsx` — outer (providers) + inner (router/pages) double boundary |
| Error reporter init at startup | ✅ | `main.tsx` — `errorReporter.init()` before render |

---

### Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `SENTRY_DSN` | Backend secret | Sentry project DSN — activates Sentry when set |
| `SENTRY_ENVIRONMENT` | Backend secret | e.g. `production`, `staging` (default: `NODE_ENV`) |
| `SENTRY_RELEASE` | Backend secret | Release version for source maps (e.g. `1.0.0`) |
| `VITE_SENTRY_DSN` | Frontend secret | Browser Sentry DSN |
| `VITE_SENTRY_ENVIRONMENT` | Frontend secret | e.g. `production` |
| `VITE_SENTRY_RELEASE` | Frontend secret | Release version |

*এই ফাইল Dokan360 project-এর living specification। প্রতিটি নতুন feature implement হলে Section 8 (Feature Registry) আপডেট করুন।*

---

## Section 21 — Barcode System Architecture

### Design Principles
- **Zero backend changes** — বারকোড সম্পূর্ণ frontend-only feature। DB-তে `products.barcode` column আগে থেকেই ছিল।
- **Hardware + Camera dual-mode** — Hardware wedge scanner (Enter-key) এবং camera (@zxing/browser) উভয় সমর্থিত।
- **Print-ready** — `@media print` CSS ব্যবহার করে `#barcode-print-area` ছাড়া সব hide করা হয়।
- **Pluggable label sizes** — LABEL_SIZES config object-এ নতুন size যোগ করলেই সব জায়গায় reflect হয়।

### Component Architecture

```
artifacts/dokan360/src/
  components/barcode/
    BarcodeLabel.tsx          ← Single printable label (react-barcode + product info)
    CameraScanner.tsx         ← Camera barcode scanner modal (@zxing/browser)
    BarcodePrintDialog.tsx    ← Print dialog (size picker, copies, preview, print)
  components/products/
    ProductFormDialog.tsx     ← Updated: Auto-generate barcode button (DKN{id})
    ProductsTable.tsx         ← Updated: Print label button per row (hover action)
  components/pos/
    ProductGrid.tsx           ← Updated: Camera scan button + CameraScanner modal
  pages/
    Products.tsx              ← Updated: "বারকোড" tab (bulk selection + bulk print)
  index.css                  ← Updated: @media print + scan-line animation
  i18n/locales/bn.json       ← Updated: "barcode" namespace (29 keys)
  i18n/locales/en.json       ← Updated: "barcode" namespace (29 keys)
```

### Label Sizes

| Size Key | বাংলা নাম | Dimensions | Use Case |
|---|---|---|---|
| `sm` | ছোট | 38×25mm / 144×94px | Price tag, jewelry |
| `md` | মাঝারি | 58×40mm / 219×151px | Standard shelf label |
| `lg` | বড় | 100×50mm / 378×189px | Large shelf / carton |

### Barcode Auto-Generation

```
Existing product (edit):  DKN0000042   (DKN + productId padded to 7 digits)
New product (create):     DKN12345678  (DKN + last 8 digits of Date.now())
Format: CODE128 (alphanumeric, compact, widely supported)
```

### Scanner Flow — Hardware Wedge (POS)
```
User scans barcode → keyboard input fires → Enter key detected
→ products.find(p => p.barcode === code || p.sku === code)
→ found + active + stock > 0 → addToCart()
→ not found → red border flash (1.2s)
```

### Scanner Flow — Camera (POS)
```
User taps Camera button → CameraScanner modal opens
→ @zxing/browser BrowserMultiFormatReader starts video stream (facingMode: environment)
→ decodeFromConstraints() callback fires on barcode detection
→ result.getText() → handleCameraScan(code)
→ product lookup → addToCart() → modal auto-closes
→ cleanup: BrowserMultiFormatReader.releaseAllStreams()
```

### Print Flow
```
BarcodePrintDialog opens (single or bulk products)
→ User picks: label size + copies per label + show price toggle
→ Preview: CSS grid of <BarcodeLabel> components in #barcode-print-area div
→ Print button → window.print()
→ @media print: body hidden, #barcode-print-area fixed full-screen visible
→ Browser print dialog opens → labels print on sheet
```

### Packages Added

| Package | Version | Purpose |
|---|---|---|
| `react-barcode` | latest | Renders CODE128 barcode as inline SVG via JsBarcode |
| `@zxing/browser` | 0.2.0 | Camera barcode scanner (BrowserMultiFormatReader) |
| `@zxing/library` | 0.23.0 | Peer dep for @zxing/browser (barcode detection engine) |

### Feature Registry Update

| Feature | Status | Notes |
|---|---|---|
| Barcode generator (react-barcode) | ✅ | BarcodeLabel.tsx — CODE128, 3 label sizes |
| Auto-generate barcode | ✅ | ProductFormDialog.tsx — "অটো তৈরি করুন" button |
| Hardware barcode scanner input | ✅ | ProductGrid.tsx — keyboard wedge, Enter-triggered |
| Camera barcode scanner | ✅ | CameraScanner.tsx — @zxing/browser, env camera, animated UI |
| Per-product label print | ✅ | ProductsTable.tsx — hover Printer icon → BarcodePrintDialog |
| Multiple label sizes | ✅ | sm/md/lg with configurable dimensions in LABEL_SIZES |
| Copies per label | ✅ | BarcodePrintDialog — 1–50 copies, preview updates live |
| Show/hide price on label | ✅ | BarcodePrintDialog — toggle option |
| Bulk barcode tab | ✅ | Products.tsx — "বারকোড" tab with checkbox selection |
| Bulk print sheet | ✅ | CSS grid auto-fill layout, all labels in one print job |
| Print CSS isolation | ✅ | #barcode-print-area @media print styles in index.css |
| Camera scan animation | ✅ | Corner marks + animated scan-line overlay |
| Bengali i18n | ✅ | 29 keys in barcode namespace (bn.json + en.json) |

---

## Section 22 — Advanced Dashboard Analytics Architecture

### Overview
Dashboard-এ 5টি নতুন analytics section যোগ হয়েছে। সব component নতুন বা উন্নত backend endpoint থেকে real data টানে।

### New Backend Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/dashboard/analytics?period=week` | GET | Last 12 weeks aggregated by ISO week (IYYY-"W"IW format) |
| `/dashboard/analytics?period=month` | GET | Last 12 months aggregated by YYYY-MM |
| `/dashboard/heatmap` | GET | Last 30 days — sales count + total by day of week (DOW 0–6) |

### Component Architecture

```
artifacts/dokan360/src/
  components/dashboard/
    AnalyticsChart.tsx      ← Period-switchable chart (Daily 30d / Weekly 12w / Monthly 12m)
    ProfitTrendsChart.tsx   ← Revenue + Profit dual-area chart (last 30d, margin %)
    LowStockAlerts.tsx      ← Out-of-stock + near-empty list with progress bars
    DueAnalytics.tsx        ← Top customers with outstanding due, ranked bars
    SalesHeatmap.tsx        ← Day-of-week bar chart with color intensity (blue scale)
    OutletPerformance.tsx   ← This month vs last month: revenue/profit/avg order/tx growth
  pages/
    Dashboard.tsx           ← Updated: assembles all 6 analytics sections
```

### Dashboard Layout (Top to Bottom)

```
1. Header (title + Live Data badge)
2. KPI Grid: 6 cards (today/month sales, products, low stock, customers, due)
3. Row: AnalyticsChart (2/3) + Top Products with sold qty (1/3)
4. Row: ProfitTrendsChart (full width — revenue + profit + legend + margin badge)
5. Row: LowStockAlerts (1/2) + DueAnalytics (1/2)
6. Row: SalesHeatmap (2/3) + OutletPerformance (1/3)
7. Recent Sales table
```

### AnalyticsChart — Period Selector

```
Tabs: [আজ (৩০ দিন)] [সাপ্তাহিক] [মাসিক]
- Daily:   useGetSalesChart() → 30 data points (date, total, transactions)
- Weekly:  useGetDashboardAnalytics({ period: "week" }) → up to 12 points (YYYY-WNN)
- Monthly: useGetDashboardAnalytics({ period: "month" }) → up to 12 points (YYYY-MM)
Chart: Recharts AreaChart with gradient fill, custom tooltip
```

### ProfitTrendsChart — Revenue vs Profit

```
Data: useGetProfitReport({ from: "30 days ago", to: "today" })
Chart: Recharts AreaChart with 2 series:
  - revenue (indigo #6366f1 gradient)
  - profit  (emerald #10b981 gradient)
Header badge: margin % (green if ≥ 0, red if < 0)
Legend: Bengali/English labels via i18n
```

### LowStockAlerts — Inventory Warning Panel

```
Data: useGetInventoryReport() → filter items where isLowStock === true
Display: 
  - Out-of-stock items (red badge + destructive color)
  - Near-empty items (orange, progress bar = stockQuantity / minStockLevel)
  - Empty state: CheckCircle2 icon "সমস্ত পণ্যের মজুদ পর্যাপ্ত"
Max shown: 6 items (most critical first)
```

### DueAnalytics — Customer Due Rankings

```
Data: useGetDueReport() → sorted by highest due (largest outstanding first)
Display: Customer name + due amount + relative bar (% of max due)
Footer: Total due amount + customer count
Empty state: "কোনো বাকি নেই"
Max shown: 6 customers
```

### SalesHeatmap — Day-of-Week Activity

```
Data: useGetDashboardHeatmap() → { dayOfWeek: 0-6, count, total }[]
Chart: Recharts BarChart with 7 bars (Sun→Sat)
Color intensity scale: muted → #bfdbfe → #60a5fa → #3b82f6 → #1d4ed8
Legend: Low Activity ← color scale → High Activity
Tooltip: day name + total + transaction count
```

### OutletPerformance — Month-over-Month Comparison

```
Data: useGetProfitReport() called TWICE:
  - thisMonthParams: { from: "YYYY-MM-01", to: "today" }
  - lastMonthParams: { from: "last YYYY-MM-01", to: "last YYYY-MM-last_day" }

Metrics shown:
  - মোট রাজস্ব (Total Revenue) + growth %
  - মোট মুনাফা (Total Profit)  + growth %
  - গড় অর্ডার মূল্য (Avg Order Value) + growth %
  - লেনদেন (Transactions) + growth %

GrowthBadge: TrendingUp (green) or TrendingDown (red) with % change
```

### Realtime Integration

New endpoints are invalidated on Supabase Realtime events:
```typescript
// Dashboard.tsx — invalidated on sales INSERT
qc.invalidateQueries({ queryKey: getGetDashboardAnalyticsQueryKey() });
qc.invalidateQueries({ queryKey: getGetDashboardHeatmapQueryKey() });
```

### OpenAPI Schema Additions

```yaml
AnalyticsPeriodPoint: { label: string, total: number, transactions: integer }
HeatmapPoint:         { dayOfWeek: integer, count: integer, total: number }
```

### i18n Keys Added (bn.json + en.json)

32 new keys in `dashboard` namespace including:
`periodToday`, `periodWeek`, `periodMonth`, `revenueTrends`, `revenueTrendsDesc`,
`revenueLabel`, `profitLabel`, `costLabel`, `lowStockAlerts`, `lowStockAlertsDesc`,
`noLowStock`, `dueAnalytics`, `dueCustomers`, `topDueCustomers`, `noDueCustomers`,
`heatmap`, `heatmapDesc`, `outletPerformance`, `outletPerformanceDesc`,
`growthRate`, `thisMonth`, `lastMonth`, `avgOrderValue`, `profitMargin`,
`soldQty`, `totalRevenue`, `totalProfit`, `margin`, `heatDays[]`,
`highActivity`, `lowActivity`, `loading`, `errorLoad`

### Feature Registry Update

| Feature | Status | Component | Data Source |
|---|---|---|---|
| Daily analytics (30-day chart) | ✅ | AnalyticsChart.tsx | useGetSalesChart |
| Weekly analytics (12-week) | ✅ | AnalyticsChart.tsx | useGetDashboardAnalytics(week) |
| Monthly analytics (12-month) | ✅ | AnalyticsChart.tsx | useGetDashboardAnalytics(month) |
| Revenue trends (period chart) | ✅ | AnalyticsChart.tsx | All 3 period endpoints |
| Profit trends (30-day dual area) | ✅ | ProfitTrendsChart.tsx | useGetProfitReport |
| Best selling products (ranked) | ✅ | Dashboard.tsx inline | useGetTopProducts |
| Low stock alerts panel | ✅ | LowStockAlerts.tsx | useGetInventoryReport |
| Due analytics (top customers) | ✅ | DueAnalytics.tsx | useGetDueReport |
| Customer insights | ✅ | OutletPerformance.tsx | useGetProfitReport ×2 |
| Sales heatmap (day-of-week) | ✅ | SalesHeatmap.tsx | useGetDashboardHeatmap |
| Outlet performance (MoM growth) | ✅ | OutletPerformance.tsx | useGetProfitReport ×2 |

---

## Section 23 — Notification System (TASK 14)

### Overview
Auto-generated in-app notifications for low stock, customer due alerts, and system events. Bell icon in topbar shows unread count badge. Popover panel with mark-read / delete controls.

### DB Schema — `notifications` table
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | |
| shop_id | INTEGER FK → shops | |
| user_id | INTEGER FK → users (nullable) | |
| type | TEXT | `low_stock`, `due_alert`, `sale_alert`, `system` |
| title | TEXT | Bilingual JSON `{"bn":"...","en":"..."}` — `localizeText()` parses at render |
| body | TEXT nullable | Bilingual JSON `{"bn":"...","en":"..."}` — falls back to plain text for legacy rows |
| entity_type | TEXT nullable | Related entity (e.g. `product`, `customer`) |
| entity_id | INTEGER nullable | |
| is_read | BOOLEAN | Default FALSE |
| created_at | TIMESTAMPTZ | |

### Backend Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/api/notifications` | List all notifications (auto-generates low-stock + due alerts) |
| GET | `/api/notifications/count` | Unread count (used for bell badge) |
| PATCH | `/api/notifications/:id/read` | Mark single as read |
| POST | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Component Architecture
- `NotificationCenter.tsx` — Bell button with badge, Popover panel, scroll list
  - Auto-refreshes count every 60s
  - Loads list only when popover opens
  - Mark-read on row click, hover actions for manual mark-read + delete
  - Type-based icons (Package=low_stock, Users=due_alert, ShoppingCart=sale_alert, Umbrella=leave_approved/leave_rejected, Info=system)
  - `localizeText(text, lang)` helper: parses bilingual JSON title/body, falls back to plain text for legacy rows

### Auto-generation Logic
- **Low stock**: products where `stock_quantity <= reorder_point` — creates one notification per product if not already unread
- **Due alerts**: customers with `balance < 0` (due > ৳500) — creates notification if not already unread

### Feature Registry Update
| Feature | Status | Component | Data Source |
|---|---|---|---|
| In-app notification center | ✅ | NotificationCenter.tsx | useListNotifications |
| Unread count badge | ✅ | NotificationCenter.tsx | useGetNotificationCount |
| Low stock auto-alerts | ✅ | notifications.service.ts | products + inventory |
| Customer due auto-alerts | ✅ | notifications.service.ts | customers.balance |
| Mark single read | ✅ | NotificationCenter.tsx | useMarkNotificationRead |
| Mark all read | ✅ | NotificationCenter.tsx | useMarkAllNotificationsRead |
| Delete notification | ✅ | NotificationCenter.tsx | useDeleteNotification |

---

## Section 24 — Supplier & Purchase Management (TASK 13)

### Overview
Full supplier lifecycle management with purchase order tracking, due payment system, and supplier analytics.

### DB Schema — `suppliers` table
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | |
| shop_id | INTEGER FK → shops | |
| name | TEXT | |
| phone | TEXT nullable | |
| email | TEXT nullable | |
| address | TEXT nullable | |
| balance | NUMERIC(12,2) | Negative = supplier owes shop money |
| total_purchase | NUMERIC(12,2) | Cumulative total |
| created_at, updated_at | TIMESTAMPTZ | |

### DB Schema — `purchases` table
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | |
| shop_id | INTEGER FK → shops | |
| supplier_id | INTEGER FK → suppliers nullable | |
| user_id | INTEGER FK → users | Recorded by |
| invoice_number | TEXT | Auto-generated prefix+id |
| total | NUMERIC(12,2) | |
| paid | NUMERIC(12,2) | |
| due | NUMERIC(12,2) | total - paid |
| note | TEXT nullable | |
| status | TEXT | `received`, `pending`, `cancelled` |
| purchased_at, created_at, updated_at | TIMESTAMPTZ | |

### DB Schema — `purchase_items` table
| Column | Type | Description |
|---|---|---|
| id | SERIAL PK | |
| purchase_id | INTEGER FK → purchases | |
| product_id | INTEGER FK → products nullable | |
| product_name_bn | TEXT | Snapshot at purchase time |
| quantity | NUMERIC(10,3) | |
| cost_price | NUMERIC(12,2) | |
| subtotal | NUMERIC(12,2) | quantity × cost_price |

### Backend Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/api/suppliers` | List suppliers (search param) |
| GET | `/api/suppliers/stats` | Total count, purchase, due |
| GET | `/api/suppliers/:id` | Single supplier |
| POST | `/api/suppliers` | Create supplier |
| PATCH | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete (or soft-delete if has purchases) |
| GET | `/api/purchases` | List all purchases |
| GET | `/api/purchases/stats` | Total purchases, amount, paid, due |
| GET | `/api/purchases/:id` | Purchase detail with items |
| POST | `/api/purchases` | Create purchase (auto-generates invoice number) |
| POST | `/api/purchases/:id/pay` | Record due payment |
| DELETE | `/api/purchases/:id` | Delete purchase |

### Feature Registry Update
| Feature | Status | Component | Data Source |
|---|---|---|---|
| Supplier list | ✅ | Suppliers.tsx | useListSuppliers |
| Supplier stats | ✅ | Suppliers.tsx | useGetSupplierStats |
| Add/edit supplier | ✅ | SupplierDialog | useCreateSupplier / useUpdateSupplier |
| Delete supplier | ✅ | Suppliers.tsx | useDeleteSupplier |
| Purchase list | ✅ | Purchases.tsx | useListPurchases |
| Purchase stats | ✅ | Purchases.tsx | useGetPurchaseStats |
| Create purchase | ✅ | CreatePurchaseDialog | useCreatePurchase |
| Purchase detail | ✅ | PurchaseDetailDialog | useGetPurchase |
| Pay due | ✅ | PurchaseDetailDialog | usePayPurchaseDue |
| Delete purchase | ✅ | Purchases.tsx | useDeletePurchase |

---

## Section 25 — Company Settings System (TASK 47)

### Overview
Extended shop profile with company information (email, website, tax), invoice customization (prefix, note), and logo URL. Settings page now has 3 tabs.

### DB Schema — `shops` table (extensions)
| Column | Type | Default |
|---|---|---|
| email | TEXT nullable | |
| website | TEXT nullable | |
| tax_number | TEXT nullable | TIN/VAT number |
| tax_rate | NUMERIC(5,2) | 0 |
| invoice_prefix | TEXT | 'INV' |
| invoice_note | TEXT nullable | Shown at bottom of invoice |
| logo | TEXT nullable | Direct URL |

### Settings Page Tabs
- **দোকানের তথ্য (Basic)** — name, phone, address
- **কোম্পানি (Company)** — email, website, tax number, tax rate %, logo URL + preview
- **ইনভয়েস (Invoice)** — invoice prefix, invoice note

### API Extension
`PATCH /api/shop` now accepts all new fields. `GET /api/shop` returns them in response.

### Feature Registry Update
| Feature | Status | Component | Data Source |
|---|---|---|---|
| Company email/website | ✅ | Settings.tsx (companyTab) | useUpdateShop |
| Tax number/rate | ✅ | Settings.tsx (companyTab) | useUpdateShop |
| Invoice prefix | ✅ | Settings.tsx (invoiceTab) | useUpdateShop |
| Invoice note | ✅ | Settings.tsx (invoiceTab) | useUpdateShop |
| Logo URL + preview | ✅ | Settings.tsx (companyTab) | useUpdateShop |

---

## Section 26 — Advanced Settings Module + User Role Category System (TASK 48 + TASK 36)

### Overview
Full role-based permission matrix (10 role categories × 30+ granular permissions) stored in DB per shop, plus system preferences (language, timezone, date format, currency, low-stock threshold) and notification toggles — all managed from the Settings page.

### DB Schema — `role_permissions` table
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | auto-increment |
| shop_id | INTEGER NOT NULL | FK → shops(id) |
| role | TEXT NOT NULL | e.g. `manager`, `cashier` |
| permissions | JSONB NOT NULL | `{perm_key: boolean, ...}` |
| created_at | TIMESTAMPTZ | auto |
| updated_at | TIMESTAMPTZ | auto |
| UNIQUE | (shop_id, role) | one row per role per shop |

**Schema file:** `lib/db/src/schema/role-permissions.ts`

### Role Categories (10 roles)
`super_admin`, `shop_admin`, `manager`, `accountant`, `hr_manager`, `inventory_manager`, `sales_manager`, `cashier`, `seller`, `viewer`

### Permission Groups (12 groups, 30+ permissions)
| Group | Permissions |
|---|---|
| dashboard | dashboard.view |
| pos | pos.use, pos.apply_discount |
| sales | sales.view, sales.create, sales.delete |
| products | products.view, products.create, products.update, products.delete |
| inventory | inventory.view, inventory.adjust |
| customers | customers.view, customers.create, customers.update, customers.delete |
| suppliers | suppliers.view, suppliers.create, suppliers.update |
| purchases | purchases.view, purchases.create |
| reports | reports.view, reports.export |
| audit_logs | audit_logs.view |
| settings | settings.view, settings.update |
| users | users.view, users.invite, users.deactivate |

### API Endpoints
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/role-permissions` | requireAuth | Full permission matrix for shop |
| PUT | `/api/role-permissions/:role` | admin | Save permissions for one role |
| DELETE | `/api/role-permissions/:role/reset` | admin | Reset role to defaults |

**Backend files:**
- `artifacts/api-server/src/modules/permissions/permissions.service.ts`
- `artifacts/api-server/src/modules/permissions/permissions.router.ts`

### Settings Page Tabs (after TASK 48)
| Tab | Value | Visibility | Component |
|---|---|---|---|
| দোকানের তথ্য | `shop` | admin | ShopInfoTab (inline) |
| ব্যবহারকারী | `users` | all | UserManagementTab (inline) |
| প্রিন্টার | `printer` | admin | PrinterSettingsTab (inline) |
| আউটলেট | `outlet` | admin | OutletSettingsTab (inline) |
| ভূমিকা অনুমতি | `roles` | admin | `RolePermissionsTab.tsx` |
| সিস্টেম | `system` | admin | `SystemSettingsTab.tsx` |
| নোটিফিকেশন | `notif` | all | `NotifSettingsTab.tsx` |

### System Settings (localStorage, `dokan360_system_settings`)
- language (bn/en), timezone, dateFormat, currency, lowStockThreshold

### Notification Settings (localStorage, `dokan360_notif_settings`)
- lowStock, newSale, dueAlert, dailyReport, email

### Feature Registry Update
| Feature | Status | Component | Data Source |
|---|---|---|---|
| 10 role categories | ✅ | RolePermissionsTab.tsx | DB `role_permissions` |
| 30+ granular permissions | ✅ | RolePermissionsTab.tsx | GET /api/role-permissions |
| Per-role permission toggle | ✅ | RolePermissionsTab.tsx | PUT /api/role-permissions/:role |
| Reset to defaults | ✅ | RolePermissionsTab.tsx | DELETE /api/role-permissions/:role/reset |
| System settings | ✅ | SystemSettingsTab.tsx | localStorage |
| Notification settings | ✅ | NotifSettingsTab.tsx | localStorage |

---

## Change Log

> প্রতিটি significant change-এর পরে এখানে entry যোগ করতে হবে।
> Format: Date → What changed → Why → Impacted modules

---

### 2026-05-08 — Project initialized on Replit from GitHub

- **Changed**: GitHub repository clone করা হয়েছে, Replit-এ setup করা হয়েছে
- **Why**: নতুন Replit environment-এ project চালু করার জন্য
- **Impacted**: Full project — all modules

### 2026-05-08 — Agent Rules & BLUEPRINT.md system established

- **Changed**: `replit.md`-এ comprehensive agent rules যোগ করা হয়েছে (16টি rule); BLUEPRINT.md-এ Change Log system চালু করা হয়েছে; Rule 11 agent-driven automatic update system হিসেবে define করা হয়েছে
- **Why**: Project-এ consistent development standard এবং living architecture contract নিশ্চিত করার জন্য
- **Impacted**: `replit.md`, `BLUEPRINT.md`

### 2026-05-14 — Email OTP verification for new registrations

- **Changed**: `registerShop()` — `email_confirm: false` (was `true`), removed session token return, now returns `{ email }` only. New `OtpVerificationStep.tsx` component (6-digit OTP input, 60s resend countdown). `Register.tsx` — after successful register calls `supabase.auth.signInWithOtp()` and shows OTP step. New i18n keys in `bn.json` / `en.json`. `openapi.yaml` — register response changed to `RegisterPendingResponse`.
- **Why**: Email verification for new shop registrations — user must verify email before entering app. Existing login flow unchanged.
- **Impacted**: `artifacts/api-server/src/modules/auth/auth.service.ts`, `artifacts/dokan360/src/pages/Register.tsx`, `artifacts/dokan360/src/components/auth/OtpVerificationStep.tsx`, `lib/api-spec/openapi.yaml`, i18n locale files

### 2026-05-08 — i18next confirmed as official i18n system

- **Changed**: Rule 4 (UI & Language Rules) update করা হয়েছে — `i18next` + `react-i18next` official i18n solution হিসেবে confirm করা হয়েছে; mandatory rules যোগ করা হয়েছে নতুন text যোগ করার জন্য
- **Why**: বাংলা ও English দুই ভাষা support নিশ্চিত করার জন্য; hardcoded text নিষেধ করার জন্য
- **Impacted**: `artifacts/dokan360/src/i18n/`, `replit.md` Rule 4

### 2026-05-09 — users.role → user_roles FK link (userRoleId column)

- **Changed**: `users` table-এ `user_role_id` column যোগ করা হয়েছে (TEXT, FK → `user_roles.id`); existing users backfill করা হয়েছে; নতুন user create করার সময় auto-set হয়; `EmployeeDto` ও `SystemUserDto`-তে `systemRoleLabel` field যোগ — এখন DB থেকে সরাসরি label আসে
- **Why**: `users.role` (admin/seller/viewer enum) এবং `user_roles` table-এর মধ্যে explicit DB-level FK relationship তৈরি করা হয়েছে; display label এখন static map-এর বদলে actual `user_roles` table থেকে আসে
- **Impacted**: `lib/db/src/schema/users.ts`, `artifacts/api-server/src/modules/employees/employees.service.ts`, `artifacts/dokan360/src/pages/Employees.tsx`

### 2026-05-09 — employees.name ↔ users.name bidirectional sync fix

- **Changed**: `updateEmployee()` — employee-এর নাম পরিবর্তন হলে linked `users.name`-ও sync হয়; `createEmployee()` with `linkUserId` — system-only user থেকে employee তৈরির সময় `users.name` sync হয়
- **Why**: `employees` ও `users` table-এ দুটো আলাদা `name` column থাকায় divergence হচ্ছিল — employee form-এ নাম বদলালে `users.name` (Settings > User Management-এ দেখা যায়) আপডেট হতো না
- **Impacted**: `artifacts/api-server/src/modules/employees/employees.service.ts`

### 2026-05-09 — Settings User Management tab: InviteUserForm removed, role change + re-activate added

- **Changed**: `InviteUserForm` component সম্পূর্ণ সরানো হয়েছে; user list-এ inline role Select dropdown যোগ — সরাসরি role change করা যায়; inactive user-দের পাশে `UserCheck` re-activate button যোগ; deactivate/activate confirmation dialog-গুলো controlled state-এ convert; নতুন i18n keys যোগ: `activateSuccess`, `activateConfirm`, `roleChanged`, `roleChangeError`
- **Why**: User Management tab-এ শুধু deactivate button ছিল — role change ও re-activate করার কোনো option ছিল না; InviteUserForm ছিল কিন্তু user কর্তৃক remove-এর request
- **Impacted**: `artifacts/dokan360/src/pages/Settings.tsx`, `artifacts/dokan360/src/i18n/locales/bn.json`, `artifacts/dokan360/src/i18n/locales/en.json`

### 2026-05-14 — Registration redirect fix: session set after successful signup

- **Changed**: `Register.tsx`-এ `onSubmit()` — registration সফল হলে backend থেকে আসা `accessToken` ও `refreshToken` দিয়ে `supabase.auth.setSession()` কল করা হচ্ছে; এর ফলে `AuthContext`-এর `onAuthStateChange → SIGNED_IN` fire হয় → `/api/auth/me` fetch হয় → dashboard-এ redirect হয়
- **Why**: Registration-এর পর user register page-এ আটকে থাকত — session কখনো set হতো না, redirect হতো না
- **Impacted**: `artifacts/dokan360/src/pages/Register.tsx`

### 2026-05-14 — Registration bug fix: users.password_hash NOT NULL constraint

- **Changed**: Supabase `users` table-এ `password_hash` column `NOT NULL` থেকে `nullable` করা হয়েছে (`ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL`); Drizzle schema (`lib/db/src/schema/users.ts`)-এ `passwordHash: text("password_hash")` nullable হিসেবে যোগ করা হয়েছে
- **Why**: `POST /api/auth/register` — 500 error দিচ্ছিল। Supabase Auth নিজেই password `auth.users`-এ manage করে; custom `users` table-এ `password_hash` column legacy — অ্যাপ কোডে কখনো set হয় না, তাই NOT NULL constraint registration block করছিল
- **Impacted**: Supabase PostgreSQL (`public.users` table), `lib/db/src/schema/users.ts`

### 2026-05-15 — Leave Types: global defaults + per-shop override system

- **Changed**:
  - `lib/db/src/schema/leaves.ts` — `leave_types.shop_id` → nullable (`NULL` = system-wide global default); নতুন `leave_type_overrides` table যোগ (per-shop override: `isHidden`, `name`, `nameBn`, `defaultDays`, `isPaid`, `color`, `isActive`; UNIQUE `shop_id + leave_type_id`)
  - `artifacts/api-server/src/modules/leaves/leaves.service.ts` — `listLeaveTypes()` now merges: global defaults + shop overrides + shop-specific custom types; `updateLeaveType()` — default type edit করলে shop-specific override create/update হয়; `deleteLeaveType()` — default type hide করলে `isHidden=true` override তৈরি হয়; shop-specific type-এ normal update/delete; `LeaveTypeDto` — নতুন `isDefault` ও `isOverridden` fields
  - `lib/api-spec/openapi.yaml` — `LeaveType` schema-এ `isDefault: boolean`, `isOverridden: boolean` যোগ; `shopId` nullable
  - `artifacts/dokan360/src/components/leaves/LeaveTypesTab.tsx` — "সিস্টেম ডিফল্ট" ও "কাস্টম" দুই section-এ ভাগ; default badge, customized badge; edit dialog-এ hint text; delete confirmation-এ default type-বিশেষ message
  - `lib/db/scripts/seed-leave-types.ts` — ১১টি system default leave type seed script
  - `lib/db/scripts/migrate-leave-types.ts` — direct SQL migration script
  - i18n: `bn.json` ও `en.json`-এ নতুন 11টি key যোগ
- **Why**: সব shop automatically ১১টি industry-standard default leave type পাবে (Casual, Sick, Earned, Maternity, Paternity, Medical, Study, Emergency, Without Pay, Compensatory, Festival); প্রতিটি shop নিজস্বভাবে customize বা hide করতে পারবে — global default নষ্ট হবে না; নতুন shop join করলেই সব defaults পাবে
- **Impacted**: `lib/db/src/schema/leaves.ts`, `artifacts/api-server/src/modules/leaves/leaves.service.ts`, `lib/api-spec/openapi.yaml`, `lib/api-client-react/src/generated/` (codegen), `artifacts/dokan360/src/components/leaves/LeaveTypesTab.tsx`, i18n locale files, Supabase DB (schema + seed data)

### 2026-05-15 — Payroll System — Full Salary Structure Upgrade

- **Changed**: `payroll_records` table-এ ৯টি নতুন column যোগ হয়েছে: `house_rent_allowance`, `medical_allowance`, `transport_allowance`, `food_allowance`, `commission`, `provident_fund_employee`, `provident_fund_employer`, `tax_deduction`, `loan_deduction` — সবই `NUMERIC(12,2) DEFAULT 0`
- **Changed**: `calcTotals()` — নতুন formula: `gross = baseSalary + houseRent + medical + transport + food + commission + overtime + bonus`; `net = gross − advance − otherDeductions − unpaidLeaveDeduction − pfEmployee − tax − loan`
- **Changed**: `UpdatePayrollRecordBody` (openapi.yaml + router zod schema) — সব নতুন allowance ও deduction field-এ editable
- **Changed**: `Payroll.tsx` — expandable row breakdown (allowances vs deductions split view), edit dialog-এ grouped fields (ভাতাসমূহ / কর্তনসমূহ), live gross+net preview in edit dialog
- **Changed**: i18n `bn.json` + `en.json` — নতুন keys: `allowances`, `houseRentAllowance`, `medicalAllowance`, `transportAllowance`, `foodAllowance`, `commission`, `deductions`, `providentFundEmployee`, `providentFundEmployer`, `taxDeduction`, `loanDeduction`
- **Why**: বাংলাদেশের standard salary structure অনুযায়ী সম্পূর্ণ payroll system — Basic + House Rent + Medical + Transport + Food + Commission + OT + Bonus − PF − Tax − Loan
- **Impacted**: `lib/db/src/schema/payroll.ts`, `artifacts/api-server/src/modules/payroll/payroll.service.ts`, `artifacts/api-server/src/modules/payroll/payroll.router.ts`, `lib/api-spec/openapi.yaml`, `lib/api-client-react/src/generated/` (codegen), `lib/api-zod/src/generated/` (codegen), `artifacts/dokan360/src/pages/Payroll.tsx`, i18n locale files, Supabase DB (9 new columns)

---

### 2026-05-15 — TASK 42: Payroll & Salary System

- **Added**:
  - `lib/db/src/schema/payroll.ts` — `payroll_records` table (`payroll_payment_status` enum: unpaid/paid; UNIQUE `shop_id+employee_id+month+year`)
  - `artifacts/api-server/src/modules/payroll/payroll.service.ts` — `listPayroll`, `getPayrollStats`, `generatePayroll`, `getPayrollRecord`, `updatePayrollRecord`, `markPayrollPaid`, `deletePayrollRecord`, `getEmployeePayrollHistory`
  - `artifacts/api-server/src/modules/payroll/payroll.router.ts` — 7 REST endpoints under `/api/payroll`
  - `artifacts/api-server/src/router.ts` — payrollRouter mounted
  - `lib/api-spec/openapi.yaml` — payroll paths + PayrollRecord/PayrollStats/UpdatePayrollRecordBody schemas
  - `artifacts/dokan360/src/pages/Payroll.tsx` — bilingual payroll management page (month/year picker, stat cards, record list, generate/edit/pay/delete dialogs)
  - `artifacts/dokan360/src/layouts/AppLayout.tsx` — `/payroll` nav entry (Banknote icon)
  - i18n keys: `payroll.*` added to bn.json + en.json
- **Business logic**: Bangladesh weekend (Fri+Sat) excluded from working days; overtime rate = baseSalary/(26×8×60) per minute; unpaid leave deduction = (baseSalary/workingDays)×unpaidDays; grossSalary = base+overtime+bonus; netSalary = gross−advance−otherDeductions−unpaidLeaveDeduction
- **Impacted**: `lib/db/src/schema/payroll.ts`, `lib/db/src/schema/index.ts`, `artifacts/api-server/src/modules/payroll/`, `artifacts/api-server/src/router.ts`, `lib/api-spec/openapi.yaml`, `lib/api-client-react/src/generated/` (codegen), `lib/api-zod/src/generated/` (codegen), `artifacts/dokan360/src/pages/Payroll.tsx`, `artifacts/dokan360/src/App.tsx`, `artifacts/dokan360/src/layouts/AppLayout.tsx`, i18n locale files

### 2026-05-15 — TASK 42B: Salary Grade System

- **Added**:
  - `lib/db/src/schema/salary-grades.ts` — `salary_grades` table (id, shopId, name, description, basicPercent, houseRentPercent, medicalPercent, transportPercent, foodPercent, otherPercent, timestamps)
  - `lib/db/src/schema/employees.ts` — `salaryGradeId` FK column added
  - `artifacts/api-server/src/modules/salary-grades/salary-grades.service.ts` — CRUD service with 100% percent-sum validation
  - `artifacts/api-server/src/modules/salary-grades/salary-grades.router.ts` — 5 REST endpoints under `/api/salary-grades`
  - `artifacts/api-server/src/router.ts` — `salaryGradesRouter` mounted
  - `lib/api-spec/openapi.yaml` — `/salary-grades` paths + `SalaryGrade`, `CreateSalaryGradeBody`, `UpdateSalaryGradeBody` schemas
  - `lib/api-client-react/src/generated/` — hooks: `useListSalaryGrades`, `useCreateSalaryGrade`, `useUpdateSalaryGrade`, `useDeleteSalaryGrade`, `useGetSalaryGrade`
  - `artifacts/dokan360/src/pages/SalaryGrades.tsx` — full CRUD page with grade cards, percent bar chart visualization, create/edit/delete dialogs
  - `artifacts/dokan360/src/layouts/AppLayout.tsx` — `/salary-grades` nav entry (GraduationCap icon, lime color)
  - `artifacts/dokan360/src/App.tsx` — lazy route `/salary-grades`
  - i18n keys: `salaryGrades.*` + `nav.salaryGrades` added to bn.json + en.json
- **Business logic**: Sum of all 6 percents (basic+houseRent+medical+transport+food+other) must equal exactly 100. Payroll generate auto-reads assigned grade and sets houseRent/medical/transport/food allowances from grade percentages × baseSalary.
- **Impacted**: `lib/db/src/schema/salary-grades.ts`, `lib/db/src/schema/employees.ts`, `lib/db/src/schema/index.ts`, `artifacts/api-server/src/modules/salary-grades/`, `artifacts/api-server/src/modules/employees/employees.service.ts`, `artifacts/api-server/src/modules/payroll/payroll.service.ts`, `artifacts/api-server/src/router.ts`, `lib/api-spec/openapi.yaml`, `lib/api-client-react/src/generated/`, `artifacts/dokan360/src/pages/SalaryGrades.tsx`, `artifacts/dokan360/src/App.tsx`, `artifacts/dokan360/src/layouts/AppLayout.tsx`, i18n locale files

### 2026-05-15 — Salary Grade Default System (Copy-on-Write)

- **Changed**:
  - `lib/db/src/schema/salary-grades.ts`: `shopId` nullable করা হয়েছে (system defaults-এর জন্য `NULL`); নতুন column `isSystemDefault boolean NOT NULL DEFAULT false`
  - `lib/api-spec/openapi.yaml`: `SalaryGrade` schema-তে `isDefault: boolean` যোগ; `shopId` nullable করা হয়েছে
  - `artifacts/api-server/src/modules/salary-grades/salary-grades.service.ts`: Copy-on-write architecture — `hasOwnGrades()`, `copyDefaultsToShop()`, `resolveGradeForShop()` helper যোগ; `listSalaryGrades` এখন shop-এর নিজস্ব grade না থাকলে system defaults দেখায়; create/update/delete-এ প্রথম interaction-এ defaults shop-এর নামে clone হয়
  - `lib/api-client-react/src/generated/`: codegen-এ `isDefault` field যোগ হয়েছে
  - `artifacts/dokan360/src/pages/SalaryGrades.tsx`: `GradeCard`-এ `ShieldCheck` icon সহ "সিস্টেম" badge — `grade.isDefault === true` হলে দেখায়
  - `artifacts/dokan360/src/i18n/locales/bn.json` ও `en.json`: `systemBadge`, `systemBadgeTitle` key যোগ
  - `lib/db/src/migrate-salary-grades-defaults.ts`: targeted migration script — `shop_id DROP NOT NULL`, `is_system_default` column add, 4টি default grade seed
- **Why**: নতুন shop salary grades page-এ empty state দেখত; system-wide default grades দিলে সব shop প্রথমে একই structure দেখবে; shop কিছু পরিবর্তন করলে শুধু তার নিজের data দেখবে — অন্য shops বা system defaults অপ্রভাবিত থাকবে
- **Default Grades Seeded**: গ্রেড-এ (সিনিয়র, 60/25/5/5/5/0%), গ্রেড-বি (মিড, 55/25/7/7/6/0%), গ্রেড-সি (জুনিয়র, 50/30/8/7/5/0%), গ্রেড-ডি (এন্ট্রি, 50/28/8/8/6/0%)
- **Impacted**: `lib/db/src/schema/salary-grades.ts`, `lib/api-spec/openapi.yaml`, `artifacts/api-server/src/modules/salary-grades/salary-grades.service.ts`, `artifacts/dokan360/src/pages/SalaryGrades.tsx`, `artifacts/dokan360/src/i18n/locales/bn.json`, `artifacts/dokan360/src/i18n/locales/en.json`

### 2026-05-15 — Bilingual notification system + Leave i18n fixes

- **Changed**:
  - `notifications.service.ts`: `generateLowStockNotifications` ও `generateDueNotifications` — `title`/`body` এখন `JSON.stringify({bn:"...", en:"..."})` format-এ store হয়
  - `leaves-requests.service.ts`: leave_approved ও leave_rejected notification — একই bilingual JSON format
  - `NotificationCenter.tsx`: `localizeText(text, lang)` helper যোগ — JSON parse করে `i18n.language` অনুযায়ী সঠিক ভাষা দেখায়; plain text fallback সহ (পুরনো notifications backward compatible)
  - `LeaveRequestsTab.tsx`: `isBn ? req.leaveTypeNameBn : req.leaveTypeName` — hardcoded Bengali সরানো হয়েছে
  - `LeaveBalancesTab.tsx`: column header ও legend-এ `isBn ? lt.nameBn : lt.name` — hardcoded Bengali সরানো হয়েছে
- **Why**: English mode-এ notification bell ও Leave Management page-এ Bengali text দেখাচ্ছিল; bilingual JSON approach DB schema পরিবর্তন ছাড়াই সমাধান দেয় এবং পুরনো plain-text rows backward compatible থাকে
- **Impacted**: `artifacts/api-server/src/modules/notifications/notifications.service.ts`, `artifacts/api-server/src/modules/leaves/leaves-requests.service.ts`, `artifacts/dokan360/src/components/notifications/NotificationCenter.tsx`, `artifacts/dokan360/src/components/leaves/LeaveRequestsTab.tsx`, `artifacts/dokan360/src/components/leaves/LeaveBalancesTab.tsx`

### 2026-05-14 — Supabase DB-level triggers: employees ↔ users bidirectional name sync

- **Changed**: Supabase PostgreSQL-এ দুটো trigger তৈরি হয়েছে — `trg_sync_employee_name_to_user` (employees.name পরিবর্তে linked users.name auto-update) এবং `trg_sync_user_name_to_employee` (users.name পরিবর্তে linked employees.name auto-update); `scripts/create-name-sync-triggers.mjs` migration script সংরক্ষিত; উভয় trigger `SECURITY DEFINER` + `IS DISTINCT FROM` guard দিয়ে infinite loop proof
- **Why**: Backend code-level sync যথেষ্ট নয় — DB trigger দিলে backend bypass হলেও (direct SQL, Supabase dashboard edit) data সবসময় consistent থাকবে; two-table architecture রেখে enterprise-grade data integrity নিশ্চিত করা হয়েছে
- **Impacted**: Supabase PostgreSQL (public.employees trigger, public.users trigger), `scripts/create-name-sync-triggers.mjs`
