/**
 * Seed script: inserts the 11 system-wide default leave types (shopId = NULL).
 * Run once after schema push:
 *   pnpm --filter @workspace/db run seed:leaves
 *
 * Safe to re-run — uses ON CONFLICT DO NOTHING via a name-level guard.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { isNull } from "drizzle-orm";
import { leaveTypesTable } from "../src/schema/leaves.js";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const db   = drizzle(pool);

const DEFAULT_LEAVE_TYPES = [
  { name: "Casual Leave",            nameBn: "নৈমিত্তিক ছুটি",       defaultDays: 10, isPaid: true,  color: "#3b82f6" },
  { name: "Sick Leave",              nameBn: "অসুস্থতার ছুটি",       defaultDays: 14, isPaid: true,  color: "#ef4444" },
  { name: "Earned / Annual Leave",   nameBn: "অর্জিত / বার্ষিক ছুটি", defaultDays: 15, isPaid: true,  color: "#10b981" },
  { name: "Maternity Leave",         nameBn: "মাতৃত্বকালীন ছুটি",    defaultDays: 90, isPaid: true,  color: "#ec4899" },
  { name: "Paternity Leave",         nameBn: "পিতৃত্বকালীন ছুটি",    defaultDays: 7,  isPaid: true,  color: "#8b5cf6" },
  { name: "Medical Leave",           nameBn: "চিকিৎসার ছুটি",        defaultDays: 30, isPaid: true,  color: "#f59e0b" },
  { name: "Study Leave",             nameBn: "পড়াশোনার ছুটি",        defaultDays: 7,  isPaid: false, color: "#6366f1" },
  { name: "Emergency Leave",         nameBn: "জরুরি পরিস্থিতির ছুটি", defaultDays: 5,  isPaid: true,  color: "#f97316" },
  { name: "Without Pay Leave",       nameBn: "বিনা বেতনের ছুটি",     defaultDays: 30, isPaid: false, color: "#6b7280" },
  { name: "Compensatory Leave",      nameBn: "ক্ষতিপূরণ ছুটি",       defaultDays: 5,  isPaid: true,  color: "#14b8a6" },
  { name: "Festival / Religious Leave", nameBn: "উৎসব / ধর্মীয় ছুটি", defaultDays: 11, isPaid: true, color: "#a855f7" },
];

async function seed() {
  console.log("Checking existing default leave types…");

  const existing = await db
    .select({ name: leaveTypesTable.name })
    .from(leaveTypesTable)
    .where(isNull(leaveTypesTable.shopId));

  const existingNames = new Set(existing.map((r) => r.name));
  const toInsert = DEFAULT_LEAVE_TYPES.filter((lt) => !existingNames.has(lt.name));

  if (toInsert.length === 0) {
    console.log("All default leave types already exist. Nothing to insert.");
    await pool.end();
    return;
  }

  console.log(`Inserting ${toInsert.length} default leave type(s)…`);
  await db.insert(leaveTypesTable).values(
    toInsert.map((lt) => ({ ...lt, shopId: null, isActive: true })),
  );

  console.log("Done. Inserted:");
  toInsert.forEach((lt) => console.log(`  • ${lt.name} (${lt.nameBn})`));
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
