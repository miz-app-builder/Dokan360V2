#!/bin/bash
# ─── Dokan360 — One-Click Setup Script ────────────────────────────────────────
# GitHub থেকে clone করার পরে শুধু এই একটা script run করুন:
#   bash setup.sh
#
# কী কী হবে:
#   1. pnpm check
#   2. সব packages install
#   3. Environment variables check
#   4. supabase Database schema push
#   5. API codegen (optional)
# ─────────────────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
print_ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
print_warn() { echo -e "  ${YELLOW}⚠${NC}  $1"; }
print_err()  { echo -e "  ${RED}✗${NC} $1"; }

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════════════╗"
echo "║          🛒  Dokan360 Setup Script               ║"
echo "║     Enterprise Bengali POS SaaS — v1.0          ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Step 1: pnpm check ───────────────────────────────────────────────────────
print_step "Step 1/4 — pnpm check"

if ! command -v pnpm &> /dev/null; then
  print_warn "pnpm পাওয়া যাচ্ছে না। Install করা হচ্ছে..."
  npm install -g pnpm
  print_ok "pnpm install হয়েছে"
else
  PNPM_VERSION=$(pnpm --version)
  print_ok "pnpm v${PNPM_VERSION} পাওয়া গেছে"
fi

# ─── Step 2: Install packages ─────────────────────────────────────────────────
print_step "Step 2/4 — সব packages install হচ্ছে..."

pnpm install

print_ok "সব packages install হয়েছে"

# ─── Step 3: Environment variables check ──────────────────────────────────────
print_step "Step 3/4 — Environment variables check"

MISSING_VARS=()

if [ -z "$SUPABASE_URL" ]; then
  MISSING_VARS+=("SUPABASE_URL")
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  MISSING_VARS+=("SUPABASE_ANON_KEY")
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
fi

if [ -z "$SUPABASE_DATABASE_URL" ]; then
  MISSING_VARS+=("SUPABASE_DATABASE_URL")
fi

if [ -z "$SESSION_SECRET" ]; then
  MISSING_VARS+=("SESSION_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo ""
  print_err "নিচের required environment variables set করা নেই:"
  for VAR in "${MISSING_VARS[@]}"; do
    echo -e "     ${RED}→ $VAR${NC}"
  done
  echo ""
  echo -e "  ${YELLOW}Replit-এ Secrets tab-এ গিয়ে এগুলো set করুন।${NC}"
  echo ""
  echo -e "  ${BOLD}SUPABASE_URL${NC}              — Supabase project URL"
  echo -e "       example: https://xxxx.supabase.co"
  echo ""
  echo -e "  ${BOLD}SUPABASE_ANON_KEY${NC}         — Supabase anon/public key"
  echo ""
  echo -e "  ${BOLD}SUPABASE_SERVICE_ROLE_KEY${NC} — Supabase service role key (backend only)"
  echo ""
  echo -e "  ${BOLD}SUPABASE_DATABASE_URL${NC}     — Supabase PostgreSQL connection string"
  echo -e "       example: postgresql://postgres.xxxx:password@aws-0-xxx.pooler.supabase.com:5432/postgres"
  echo ""
  echo -e "  ${BOLD}SESSION_SECRET${NC}            — Random secret (min 32 chars)"
  echo -e "       generate: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  echo ""
  echo -e "  Variables set করার পরে আবার run করুন: ${BOLD}bash setup.sh${NC}"
  echo ""
  exit 1
else
  print_ok "SUPABASE_URL — set আছে"
  print_ok "SUPABASE_ANON_KEY — set আছে"
  print_ok "SUPABASE_SERVICE_ROLE_KEY — set আছে"
  print_ok "SUPABASE_DATABASE_URL — set আছে"
  print_ok "SESSION_SECRET — set আছে"
fi

# ─── Step 4: Database schema push ─────────────────────────────────────────────
print_step "Step 4/4 — Database schema push হচ্ছে..."

pnpm --filter @workspace/db run push

print_ok "Database schema আপডেট হয়েছে"

# ─── Optional: API Codegen ────────────────────────────────────────────────────
echo ""
read -p "$(echo -e ${YELLOW}"  API codegen run করবেন? (OpenAPI → React Query hooks) [y/N]: "${NC})" -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "  Codegen চলছে..."
  pnpm --filter @workspace/api-spec run codegen
  print_ok "Codegen সম্পন্ন হয়েছে"
else
  print_warn "Codegen skip করা হয়েছে (OpenAPI spec পরিবর্তন না করলে দরকার নেই)"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "╔══════════════════════════════════════════════════╗"
echo "║           ✅  Setup সম্পন্ন হয়েছে!              ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  এখন app চালু করুন:"
echo ""
echo -e "  ${BOLD}Backend (API server):${NC}"
echo -e "    pnpm --filter @workspace/api-server run dev"
echo ""
echo -e "  ${BOLD}Frontend (Vite):${NC}"
echo -e "    pnpm --filter @workspace/dokan360 run dev"
echo ""
echo -e "  ${BOLD}Demo credentials:${NC}"
echo -e "    Email:    demo@dokan360.com"
echo -e "    Password: demo123"
echo ""
echo -e "  ${BOLD}Other commands:${NC}"
echo -e "    pnpm run typecheck          — TypeScript check"
echo -e "    pnpm run build              — Full build"
echo -e "    pnpm --filter @workspace/db run push  — DB schema push"
echo ""
