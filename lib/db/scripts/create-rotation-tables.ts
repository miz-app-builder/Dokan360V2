/**
 * Migration script: Create rotation pattern tables
 * Run: pnpm --filter @workspace/db exec tsx scripts/create-rotation-tables.ts
 */
import { sql } from "drizzle-orm";
import { db } from "../src/index.js";

async function main() {
  console.log("Creating rotation tables…");

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rotation_cycle_type') THEN
        CREATE TYPE rotation_cycle_type AS ENUM ('daily', 'weekly', 'monthly');
      END IF;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rotation_patterns (
      id           SERIAL PRIMARY KEY,
      shop_id      INTEGER NOT NULL REFERENCES shops(id),
      name         TEXT NOT NULL,
      name_bn      TEXT NOT NULL,
      cycle_type   rotation_cycle_type NOT NULL DEFAULT 'weekly',
      cycle_length INTEGER NOT NULL DEFAULT 2,
      start_date   DATE NOT NULL,
      is_default   BOOLEAN NOT NULL DEFAULT false,
      is_active    BOOLEAN NOT NULL DEFAULT true,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS rotation_pattern_slots (
      id          SERIAL PRIMARY KEY,
      pattern_id  INTEGER NOT NULL REFERENCES rotation_patterns(id) ON DELETE CASCADE,
      slot_index  INTEGER NOT NULL,
      weekday     INTEGER,
      shift_id    INTEGER REFERENCES shifts(id),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS employee_rotations (
      id          SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      pattern_id  INTEGER NOT NULL REFERENCES rotation_patterns(id),
      start_date  DATE NOT NULL,
      end_date    DATE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("✓ rotation_patterns created");
  console.log("✓ rotation_pattern_slots created");
  console.log("✓ employee_rotations created");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
