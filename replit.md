# Dokan360

Enterprise-grade Bengali POS SaaS for Bangladeshi shop owners.

---

## ⚠️ AGENT — MANDATORY FIRST STEP

**প্রতিটি task শুরু করার আগে `.agent-rules.md` file পড়তে হবে এবং সব rules follow করতে হবে।**

```
কাজ শুরুর আগে → .agent-rules.md পড়ো → তারপর কাজ করো
```

এই step skip করা সম্পূর্ণ নিষেধ।

---

## Quick Reference

### Workflows (শুধু এই দুটো চালাতে হবে)

| Workflow | Port | Command |
|---|---|---|
| `Backend` | `8080` | `PORT=8080 pnpm --filter @workspace/api-server run dev` |
| `Start application` | `5000` | `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/dokan360 run dev` |

Start order: `Backend` আগে → তারপর `Start application`

### Required Secrets

| Secret | কাজ |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Frontend client |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend admin |
| `SUPABASE_DATABASE_URL` | DB connection |
| `SESSION_SECRET` | Express session (min 32 chars) |

### Key Commands

| Command | কাজ |
|---|---|
| `bash setup.sh` | Fresh clone-এর পরে one-click setup |
| `pnpm install` | Packages install |
| `pnpm run typecheck` | TypeScript check |
| `pnpm run build` | Full build |
| `pnpm --filter @workspace/db run push` | DB schema push (dev) |
| `pnpm --filter @workspace/api-spec run codegen` | API hooks generate |

### Demo Credentials

- Email: `demo@dokan360.com`
- Password: `demo123`

### Key Files

| File | Purpose |
|---|---|
| `.agent-rules.md` | Agent rules (সবসময় follow করতে হবে) |
| `BLUEPRINT.md` | Live architecture contract (change হলে update করতে হবে) |
| `lib/api-spec/openapi.yaml` | API contract — source of truth |
| `lib/db/src/schema/` | Drizzle ORM schema |
| `scripts/ports.env` | Port configuration |

### Stack

- **Frontend**: React + Vite, Tailwind, shadcn/ui, Wouter, i18next
- **Backend**: Express 5, port `8080`, path `/api`
- **DB**: Supabase PostgreSQL + Drizzle ORM
- **Auth**: Supabase Auth (JWT)
- **Realtime**: Supabase channels
- **Build**: esbuild, pnpm workspaces, TypeScript 5.9
