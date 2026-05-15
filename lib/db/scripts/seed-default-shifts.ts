/**
 * Seed script: inserts 4 default shifts for every shop that has none.
 * Run once after deploying the schedule module:
 *   pnpm --filter @workspace/db run seed:shifts
 *
 * Safe to re-run — skips shops that already have shifts.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, count } from "drizzle-orm";
import { shiftsTable } from "../src/schema/schedules.js";
import { shopsTable } from "../src/schema/shops.js";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const db   = drizzle(pool);

const DEFAULT_SHIFTS = [
  {
    name:      "Morning Shift",
    nameBn:    "সকাল শিফট",
    startTime: "06:00",
    endTime:   "14:00",
    color:     "#3b82f6",
  },
  {
    name:      "Office Shift",
    nameBn:    "অফিস শিফট",
    startTime: "09:00",
    endTime:   "17:00",
    color:     "#10b981",
  },
  {
    name:      "Evening Shift",
    nameBn:    "বিকেল শিফট",
    startTime: "14:00",
    endTime:   "22:00",
    color:     "#f59e0b",
  },
  {
    name:      "Night Shift",
    nameBn:    "রাত শিফট",
    startTime: "22:00",
    endTime:   "06:00",
    color:     "#8b5cf6",
  },
] as const;

async function seedDefaultShifts() {
  console.log("Fetching all shops...");
  const shops = await db.select({ id: shopsTable.id }).from(shopsTable);
  console.log(`Found ${shops.length} shop(s)`);

  let seeded = 0;
  let skipped = 0;

  for (const shop of shops) {
    const existing = await db
      .select({ c: count() })
      .from(shiftsTable)
      .where(eq(shiftsTable.shopId, shop.id));

    const existingCount = Number(existing[0]?.c ?? 0);

    if (existingCount > 0) {
      console.log(`  Shop ${shop.id}: already has ${existingCount} shift(s) → skipping`);
      skipped++;
      continue;
    }

    await db.insert(shiftsTable).values(
      DEFAULT_SHIFTS.map((s) => ({ ...s, shopId: shop.id })),
    );
    console.log(`  Shop ${shop.id}: inserted ${DEFAULT_SHIFTS.length} default shifts ✓`);
    seeded++;
  }

  console.log(`\nDone! Seeded: ${seeded} shop(s), Skipped: ${skipped} shop(s)`);
  await pool.end();
}

seedDefaultShifts().catch((err: unknown) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
