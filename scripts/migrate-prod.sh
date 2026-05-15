#!/usr/bin/env bash
# ─── Dokan360 — Production Database Migration Script ──────────────────────────
#
# Development এ:  pnpm --filter @workspace/db run push
#   → schema সরাসরি apply করে, migration file তৈরি হয় না (risky for production)
#
# Production এ:  bash scripts/migrate-prod.sh
#   → Step 1: drizzle-kit generate → SQL migration files তৈরি করে
#   → Step 2: drizzle-kit migrate  → migration files DB-তে apply করে (safe)
#   → Migration history `drizzle_migrations` table এ track হয়
#
# Requirements:
#   SUPABASE_DATABASE_URL env var must be set
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

step() { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
err()  { echo -e "  ${RED}✗${NC} $1"; }

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════════════╗"
echo "║       🗄️   Dokan360 Production Migration         ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Guard: require SUPABASE_DATABASE_URL ─────────────────────────────────────
if [ -z "${SUPABASE_DATABASE_URL:-}" ]; then
  err "SUPABASE_DATABASE_URL is not set."
  echo ""
  echo "  Replit Secrets-এ SUPABASE_DATABASE_URL set করুন, তারপর আবার চালান।"
  exit 1
fi
ok "SUPABASE_DATABASE_URL — found"

# ─── Guard: production confirmation ───────────────────────────────────────────
if [ "${CI:-}" != "true" ]; then
  echo ""
  warn "এটি production database migration।  ডেটা পরিবর্তন হবে।"
  read -p "$(echo -e ${YELLOW}"  চালিয়ে যাবেন? [y/N]: "${NC})" -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "Migration বাতিল করা হয়েছে।"
    exit 0
  fi
fi

# ─── Step 1: Generate migration SQL files ─────────────────────────────────────
step "Step 1/2 — Migration SQL files তৈরি হচ্ছে..."
pnpm --filter @workspace/db run generate
ok "Migration files generated → lib/db/migrations/"

# ─── Step 2: Apply migrations ─────────────────────────────────────────────────
step "Step 2/2 — Migrations database-এ apply হচ্ছে..."
pnpm --filter @workspace/db run migrate
ok "Migrations applied successfully"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════╗"
echo "║        ✅  Migration সম্পন্ন হয়েছে!             ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
