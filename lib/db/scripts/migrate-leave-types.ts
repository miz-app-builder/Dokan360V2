/**
 * Migration: applies leave_types nullable shop_id + leave_type_overrides table.
 * Uses Drizzle ORM's sql`` tag — no raw pg queries.
 * Run: pnpm --filter @workspace/db run migrate:leaves
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL is not set. Add it to Replit Secrets.");
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const db   = drizzle(pool);

async function migrate() {
  // 1. Make leave_types.shop_id nullable
  await db.execute(sql`
    ALTER TABLE leave_types
      ALTER COLUMN shop_id DROP NOT NULL
  `);

  // 2. Create leave_type_overrides (idempotent)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leave_type_overrides (
      id            SERIAL PRIMARY KEY,
      shop_id       INTEGER NOT NULL REFERENCES shops(id),
      leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
      is_hidden     BOOLEAN NOT NULL DEFAULT false,
      name          TEXT,
      name_bn       TEXT,
      default_days  INTEGER,
      is_paid       BOOLEAN,
      color         TEXT,
      is_active     BOOLEAN,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT leave_type_overrides_shop_leave_type_unique UNIQUE (shop_id, leave_type_id)
    )
  `);

  await pool.end();
}

migrate().catch((err: unknown) => {
  throw err;
});
