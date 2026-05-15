# Dokan360 — Task Roadmap & Progress Tracker

> প্রতিটি task শেষ হলে `[ ]` → `[x]` করো।
> প্রতিটি feature শেষে `BLUEPRINT.md` update করতে ভুলবে না।

---

## 🌐 GLOBAL DEVELOPMENT RULES

- **RULE 1** — একবারে পুরো build করতে যেও না। Small steps-এ build করো।
- **RULE 2** — Scalable architecture maintain করো। Hacky code লিখবে না।
- **RULE 3** — Error আসলে root cause identify করো। Temporary fix নয়।
- **RULE 4** — প্রতিটি feature শেষে `BLUEPRINT.md` update করো (Feature Registry, API, Schema, Components, Services, Status)।

---

## ✅ Completed System

### Infrastructure
- [x] Supabase PostgreSQL (`SUPABASE_DATABASE_URL`)
- [x] Supabase Auth (backend: `supabaseAdmin.auth.getUser`, frontend: `supabase.auth.signInWithPassword` + `onAuthStateChange`)
- [x] Supabase Realtime (Dashboard live updates: `sales` + `inventory_adjustments`)
- [x] Drizzle ORM
- [x] RBAC (`admin`, `seller`, `viewer`)
- [x] Zod Validation
- [x] Clean Architecture
- [x] Multi-tenant System

### Frontend
- [x] Premium SaaS UI
- [x] Bengali i18n
- [x] Dark/Light Mode
- [x] Mobile Responsive
- [x] POS System
- [x] Reports
- [x] Charts
- [x] Dashboard

### Architecture
- [x] AI-ready foundation
- [x] Offline-ready foundation
- [x] SaaS-ready structure

---

## 🚀 PHASE 1 — Production Hardening & Deployment
> ⚠️ FIRST PRIORITY

### TASK 1 — Production Environment Setup ✅
- [x] production `.env` config
- [x] environment validation
- [x] config module
- [x] secure secrets handling
- [x] environment-based configs
- [x] production mode detection

### TASK 2 — Security Hardening ✅ COMPLETE
- [x] helmet security
- [x] rate limiting
- [x] CSRF protection
- [x] secure cookies
- [x] refresh token rotation
- [x] session/device management
- [x] suspicious login detection
- [x] audit security logs

### TASK 3 — Production Logging ✅ COMPLETE
- [x] pino transport
- [x] structured logs
- [x] request tracing
- [x] error logs
- [x] production log formatting

### TASK 4 — Health Monitoring ✅
- [x] `/health` endpoint
- [x] `/ready` endpoint
- [x] `/live` endpoint
- [x] database health checks
- [x] uptime checks

### TASK 5 — Production API Configuration ✅ COMPLETE
- [x] CORS setup
- [x] production API URLs
- [x] secure headers
- [x] trusted proxy config

### TASK 6 — Deployment Scripts ✅ COMPLETE
- [x] Vercel deployment ready (frontend)
- [x] Replit production ready (backend)
- [x] Supabase production config (database)

### TASK 7 — Build Optimization ✅ COMPLETE
- [x] code splitting (Rollup `manualChunks` — 9 vendor chunks: charts, motion, supabase, query, react, radix, xlsx, i18n, icons)
- [x] lazy loading (React.lazy + Suspense — all 11 pages lazy-loaded; sidebar stays visible during chunk download)
- [x] bundle optimization (target: es2020, cssCodeSplit, chunkSizeWarningLimit, organised output paths)
- [x] image optimization (asset output paths organised: `assets/img/`, `assets/css/`, `assets/js/`)
- [x] asset compression (Express `compression` middleware — gzip level 6, threshold 1 kB, SSE-safe filter)

### TASK 8 — Error Monitoring Preparation ✅ COMPLETE
- [x] Sentry-ready architecture
- [x] centralized error tracking
- [x] production error reporting

> **⚠️ পরে করতে হবে — Sentry Activate করতে:**
> 1. sentry.io-তে account খুলো → নতুন project তৈরি করো → DSN key নাও
> 2. `pnpm --filter @workspace/api-server add @sentry/node` — backend SDK install
> 3. `pnpm --filter @workspace/dokan360 add @sentry/react` — frontend SDK install
> 4. Replit Secrets-এ set করো: `SENTRY_DSN` (backend) + `VITE_SENTRY_DSN` (frontend)
> 5. Backend restart করো → Sentry auto-activate হবে
> 6. Frontend-এ `main.tsx`-এ `installSentry(Sentry)` call যোগ করো (BLUEPRINT.md Section 20 দেখো)

### TASK 9 — SEO Basics ✅ COMPLETE
- [x] meta tags
- [x] OG tags
- [x] sitemap
- [x] favicon system
- [x] manifest basics

---

## 🚀 PHASE 2 — Core POS Business Features

### TASK 10 — Thermal Receipt Printing ✅ COMPLETE
- [x] 58mm printer support
- [x] 80mm printer support
- [x] Bengali receipt support
- [x] print preview modal (ReceiptModal.tsx — size selector + scrollable preview)
- [x] invoice number
- [x] QR code (qrcode.react — encodes invoice number)
- [ ] shop logo (deferred — shops may not have logos yet)
- [x] auto print after checkout (Print button in InvoiceModal opens ReceiptModal → window.print())
- [x] ESC/POS compatible structure (monospace layout, dashed separators, fixed width)
- [x] browser print optimization (@media print CSS — only #receipt-print-area visible, @page margin reset)
- [x] mobile printing support (responsive print portal, 58mm/80mm size toggle)

### TASK 11 — Barcode System ✅ COMPLETE
- [x] barcode generator (react-barcode, CODE128 format, `DKN{id}` auto-gen)
- [x] barcode scanner input (hardware wedge scanner via POS keyboard input, Enter-triggered)
- [x] camera barcode scanner (`@zxing/browser` BrowserMultiFormatReader, environment camera, animated UI)
- [x] product barcode assignment (auto-generate button in ProductFormDialog, `DKN{id}` or timestamp-based)
- [x] barcode label printing (BarcodePrintDialog — preview + window.print(), @media print CSS)
- [x] multiple label sizes (Small 38×25mm, Medium 58×40mm, Large 100×50mm)
- [x] bulk barcode generation (Products > বারকোড tab — checkbox selection of any/all products)
- [x] print sheets (CSS grid auto-fill layout, label quantity per product configurable 1–50)

### TASK 12 — Advanced Dashboard Analytics ✅ COMPLETE
- [x] daily analytics (30-day area chart with period selector)
- [x] weekly analytics (last 12 weeks aggregated — `/dashboard/analytics?period=week`)
- [x] monthly analytics (last 12 months aggregated — `/dashboard/analytics?period=month`)
- [x] revenue trends (AnalyticsChart.tsx — Daily/Weekly/Monthly tabs, period-switchable)
- [x] profit trends (ProfitTrendsChart.tsx — revenue + profit dual-area, 30-day, margin %)
- [x] best selling products (Top Products with rank, revenue bar, sold qty)
- [x] low stock alerts (LowStockAlerts.tsx — out-of-stock + near-empty with progress bars)
- [x] due analytics (DueAnalytics.tsx — top customers with outstanding, total due)
- [x] customer insights (OutletPerformance.tsx — this vs last month KPIs)
- [x] sales heatmaps (SalesHeatmap.tsx — day-of-week bar chart with intensity coloring)
- [x] outlet performance (OutletPerformance.tsx — revenue/profit/avg order/tx growth vs last month)

### TASK 13 — Purchase & Supplier Management Upgrade ✅
- [x] supplier ledger
- [x] purchase due tracking
- [x] purchase payments
- [x] supplier analytics
- [x] invoice upload
- [x] purchase history
- [x] stock auto update
- [x] supplier search/filter

### TASK 14 — Notification System ✅
- [x] in-app notifications
- [x] low stock alerts
- [x] due alerts
- [x] sales alerts
- [x] toast notifications
- [x] notification center
- [x] read/unread state

### TASK 15 — Audit Logs System ✅
- [x] login tracking
- [x] logout tracking
- [x] sales tracking
- [x] stock change tracking
- [x] product edit tracking
- [x] user action tracking
- [x] settings update tracking
- [x] searchable logs
- [x] filters
- [x] all-roles access (not admin-only)

### TASK 16 — SaaS Subscription Architecture
> ⚠️ Architecture only first
- [ ] free trial
- [ ] monthly plans
- [ ] annual plans
- [ ] tenant subscription status
- [ ] feature gating
- [ ] usage limits
- [ ] billing history
- [ ] plan management

---

## 🚀 PHASE 2.5 — Employee Management + HR System
> ⚠️ HIGH BUSINESS VALUE

### TASK 35 — Advanced Employee Management System ✅ COMPLETE
- [x] Employee Profile
  - [x] employee photo (field stored, UI-ready)
  - [x] employee ID (employeeCode)
  - [x] full name
  - [x] father name
  - [x] mother name
  - [x] phone number
  - [x] emergency contact
  - [x] email
  - [x] address
  - [x] NID number
  - [x] date of birth
  - [x] gender
  - [x] joining date
  - [x] blood group
  - [x] salary
  - [x] status
  - [x] department
  - [x] designation
  - [x] notes
- [x] Employee Documents (Supabase Storage — `employee-docs` private bucket)
  - [x] NID upload (PDF/JPG/PNG/WEBP, max 10 MB)
  - [x] CV upload (PDF/JPG/PNG, max 10 MB)
  - [x] contract upload (PDF/JPG/PNG, max 10 MB)
  - [x] profile image upload (JPG/PNG/WEBP, max 10 MB)
- [x] Employee Status (active / inactive / suspended / resigned)
- [x] Employee Search & Filter
  - [x] search by name
  - [x] search by phone
  - [x] department filter
  - [x] designation filter
  - [x] active/inactive filter

### TASK 36 — User Role Category System ✅ COMPLETE
> ⚠️ Advanced enterprise RBAC

- [x] User Categories
  - [x] Super Admin
  - [x] Shop Admin
  - [x] Manager
  - [x] Accountant
  - [x] HR Manager
  - [x] Inventory Manager
  - [x] Sales Manager
  - [x] Cashier
  - [x] Seller
  - [x] Viewer
- [x] Dynamic Role Permissions
  - [x] Permission Groups (dashboard, POS, products, inventory, reports, analytics, employee mgmt, HR, settings, subscription)
  - [x] Granular Permissions (create_product, update_product, delete_product, view_reports, manage_users, approve_discount, adjust_inventory, etc.)

### TASK 37 — User Wise Access Control System ✅
- [x] Module-wise Access (page access, menu visibility, API access, action permissions)
- [x] Outlet-wise Access (branch-specific, outlet restrictions, multi-branch control)
- [x] Data Restrictions
  - [x] seller sees only own sales
  - [x] manager sees assigned outlet
  - [x] HR sees employee module only

### TASK 38 — Employee Profile Dashboard ✅ COMPLETE
- [x] employee profile page (EmployeeProfile.tsx — full profile, documents, signed URLs)
- [x] attendance summary (AttendanceSummaryWidget — real data via `/attendance/report?employeeId`, month/year selector, % bar, 6-stat grid, late+overtime badges)
- [x] duty schedule (DutyScheduleWidget — 7-day grid, color-coded shift cards with time range, language-aware, `/api/schedules?employeeId=X&type=weekly`)
- [ ] salary summary (stub — coming soon UI placeholder)
- [ ] activity logs (stub — coming soon UI placeholder)
- [ ] performance metrics (stub — coming soon UI placeholder)

### TASK 39 — Employee Attendance System ✅ DONE
- [x] check in / check out (today tab with real-time per-employee buttons)
- [x] late tracking (lateMinutes calculated on backend, shown in UI)
- [x] absent tracking (absent status, history filter)
- [x] overtime tracking (overtimeMinutes tracked in DB + report)
- [x] attendance reports (monthly report by employee with % bar)
- [x] Future-ready: fingerprint, QR, face recognition architecture (status enum, extensible schema)
- [x] DB: attendance_records table + attendance_status enum via Drizzle migration
- [x] API: 8 endpoints (list, today, check-in, check-out, create, update, delete, report)
- [x] Backend: attendance.service.ts + attendance.router.ts mounted in router.ts
- [x] Frontend: Attendance.tsx page + TodayAttendanceTab + HistoryTab + ReportTab
- [x] i18n: full bn.json + en.json coverage
- [x] Nav: CalendarCheck icon, /attendance route

### TASK 40 — Employee Duty Schedule System ✅ DONE
- [x] shift management (morning / evening / night shift with color coding)
- [x] weekly schedules (grid view — employee × weekday, drag-to-assign popover)
- [x] calendar view (monthly calendar with per-day assignment popover)
- [x] conflict detection (409 on duplicate employee+weekday assignment)
- [x] DB: `shifts` table + `duty_schedules` table + `schedule_type` enum via direct SQL migration
- [x] API: 7 endpoints — /shifts (GET,POST,PATCH,DELETE), /schedules (POST,DELETE), /schedules/weekly (GET), /schedules/calendar (GET)
- [x] Backend: `schedules.service.ts` + `schedules.router.ts` mounted in `router.ts`
- [x] Frontend: `/schedule` route → `Schedule.tsx` + `ShiftsTab`, `WeeklyScheduleTab`, `CalendarTab`
- [x] i18n: full bn.json + en.json coverage (schedule.* keys + nav.schedule)
- [x] Nav: CalendarDays icon, amber color, `/schedule` route in AppLayout

### TASK 41 — Leave Management System
- [x] leave requests
- [x] leave approval workflow
- [x] sick leave
- [x] casual leave
- [x] unpaid leave
- [x] leave balance tracking

### TASK 42 — Payroll & Salary System ✅ COMPLETE
- [x] monthly salary generation (auto-generate for all active employees)
- [x] bonus, advance, overtime pay, other deductions (editable per record)
- [x] unpaid leave deduction (automatic from approved leave requests)
- [x] overtime calculation (Bangladesh standard: salary / 26*8*60 per minute)
- [x] gross/net salary auto-calculation
- [x] payment status tracking (unpaid → paid with timestamp)
- [x] salary history per employee (last 24 months)
- [x] bilingual UI (EN/BN) + stats dashboard

### TASK 42B — Salary Grade System ✅ COMPLETE
- [x] salary_grades table (DB + Drizzle schema)
- [x] salaryGradeId FK on employees table
- [x] 6-field percent breakdown: basic, houseRent, medical, transport, food, other (must sum to 100)
- [x] full CRUD API: list, create, update, delete, get-by-id
- [x] payroll auto-populate: when grade assigned, generate fills allowances from grade percentages
- [x] SalaryGrades.tsx page with grade cards + percent bars + example calculation
- [x] bilingual UI (EN/BN) — all i18n keys in bn.json + en.json

### TASK 43 — HR Analytics Dashboard ✅ COMPLETE
- [x] attendance analytics (present/absent/late/halfDay totals, rate %, 6-month trend chart)
- [x] salary analytics (total gross/net, avg net, overtime, paid/unpaid pie chart)
- [x] employee performance (top 5 performers by attendance %, progress bars)
- [x] late statistics (top 5 late employees by total late minutes)
- [x] leave analytics (total requests, pending/approved/rejected bar chart, by-type breakdown)

### TASK 44 — Employee Activity Logs
- [ ] login / logout
- [ ] POS activity
- [ ] inventory changes
- [ ] report views
- [ ] product edits

### TASK 45 — Multi-Branch / Multi-Outlet System
> ⚠️ VERY IMPORTANT FOR SCALE

- [ ] branch management
- [ ] outlet dashboard
- [ ] outlet inventory
- [ ] branch-wise sales
- [ ] branch-wise employees
- [ ] branch transfer system

### TASK 46 — Branch Transfer System
- [ ] stock transfer
- [ ] transfer approval
- [ ] transfer history
- [ ] branch inventory sync

### TASK 47 — Company Settings System ✅
- [x] company profile
- [x] tax settings
- [x] invoice settings
- [x] logo upload
- [x] printer settings
- [x] outlet settings

### TASK 48 — Advanced Settings Module ✅ COMPLETE
- [x] role settings (10 role categories with per-permission toggle matrix)
- [x] permission settings (12 groups, 30+ granular permissions, per-role DB storage)
- [x] system settings (language, timezone, date format, currency, low-stock threshold)
- [x] notification settings (low stock, new sale, due alert, daily report, email toggle)
- [ ] backup settings (deferred)

### TASK 49 — File Upload System ✅ COMPLETE (via Employee Docs)
- [x] image uploads (employee profile photo — Supabase Storage `employee-docs` bucket)
- [x] PDF uploads (NID, CV, contract — PDF/JPG/PNG/WEBP, max 10 MB)
- [x] invoice uploads (purchase invoice upload — Purchases module)
- [x] cloud storage support (Supabase Storage — signed URLs, private bucket)

### TASK 50 — Backup & Restore System
- [ ] database backup
- [ ] export system
- [ ] restore process
- [ ] scheduled backups

---

## 🚀 FUTURE ENTERPRISE FEATURES

### TASK 51 — CRM System
- [ ] customer follow-up
- [ ] campaign system
- [ ] loyalty program
- [ ] customer segmentation

### TASK 52 — Vendor Portal
- [ ] supplier login
- [ ] purchase requests
- [ ] invoice upload

### TASK 53 — Franchise System
- [ ] franchise onboarding
- [ ] franchise billing
- [ ] franchise analytics

### TASK 54 — Enterprise Billing Engine
- [ ] invoice engine
- [ ] subscription billing
- [ ] automated renewals

---

## 🚀 PHASE 3 — Offline POS + PWA

### TASK 17 — Offline POS Implementation
> ⚠️ Existing architecture rewrite করবে না। Scalable sync architecture use করো।
- [ ] local cart persistence
- [ ] offline sale queue
- [ ] reconnect sync
- [ ] sync status indicator
- [ ] retry failed sync
- [ ] optimistic UI

### TASK 18 — Installable PWA 🔄 PARTIAL
- [x] manifest.json (full PWA manifest — standalone display, shortcuts, screenshots, Bengali lang)
- [ ] service worker
- [ ] offline caching
- [ ] install prompt
- [ ] splash screen
- [x] icon system (favicon.svg, apple-touch-icon.svg, opengraph.jpg)
- [ ] mobile app experience

---

## 🚀 PHASE 4 — Bangladesh Payment Integrations

### TASK 19 — bKash Integration
- [ ] payment gateway
- [ ] transaction verification
- [ ] payment status sync

### TASK 20 — Nagad Integration
- [ ] payment API integration
- [ ] transaction tracking

### TASK 21 — SSLCommerz Integration
- [ ] online payment checkout
- [ ] invoice payment support

---

## 🚀 PHASE 5 — Communication Features

### TASK 22 — WhatsApp Invoice System
- [ ] invoice share
- [ ] PDF invoice
- [ ] customer share flow

### TASK 23 — SMS Notification System
- [ ] invoice SMS
- [ ] due alerts
- [ ] OTP support

### TASK 24 — Email Notification System
- [ ] invoice email
- [ ] reports email
- [ ] account notifications

---

## 🚀 PHASE 6 — AI Features

### TASK 25 — Bengali AI Assistant
- [ ] Bengali chatbot
- [ ] business insights
- [ ] sales questions
- [ ] inventory suggestions

### TASK 26 — AI Forecasting
- [ ] sales forecasting
- [ ] reorder prediction
- [ ] demand prediction

### TASK 27 — AI Analytics
- [ ] anomaly detection
- [ ] trend analysis
- [ ] smart alerts

---

## 🚀 PHASE 7 — Android App
> ⚠️ Web app fully stable হওয়ার পরে শুরু করো।

### TASK 28 — Android App Architecture
- [ ] Stack decision (React Native Expo বা Capacitor wrapper)

### TASK 29 — Android POS Features
- [ ] mobile POS
- [ ] offline sync
- [ ] push notifications
- [ ] barcode scanner
- [ ] thermal printing

---

## 🚀 PHASE 8 — Enterprise Scaling
> ⚠️ NOT NOW — 50k+ users হলে ভাববে।

### TASK 30 — Redis Layer ❌ NOT NOW
- [ ] caching
- [ ] queue system
- [ ] session store

### TASK 31 — Background Jobs ❌ NOT NOW
- [ ] invoice jobs
- [ ] report jobs
- [ ] scheduled tasks

### TASK 32 — Read Replicas ❌ NOT NOW
- [ ] analytics optimization
- [ ] reporting optimization

### TASK 33 — Microservices Migration ❌ NOT NOW

### TASK 34 — Prisma Migration ❌ NOT NOW
> Only when: 50k+ users, large engineering team, scaling bottlenecks

---

## 🎯 Final Target

| Goal | Status |
|---|---|
| Real SaaS | 🔄 In Progress |
| Enterprise-ready | 🔄 In Progress |
| Multi-shop ready | ✅ Done |
| Production scalable | 🔄 In Progress |
| Offline-capable | ⏳ Pending |
| AI-ready | ✅ Foundation Done |
| Monetization-ready | ⏳ Pending |
| Android-ready | ⏳ Pending |
| Bangladesh market ready | 🔄 In Progress |
