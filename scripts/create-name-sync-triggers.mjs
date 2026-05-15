/**
 * One-time migration: Supabase DB-level triggers for bidirectional
 * name sync between `employees` and `users` tables.
 *
 * Run: node scripts/create-name-sync-triggers.mjs
 */

import pg from "pg";

const { Client } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: SUPABASE_DATABASE_URL env var not set.");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const SQL = `
-- ─── Trigger 1: employees.name → users.name ───────────────────────────────
-- When an employee's name is updated and they have a linked user_id,
-- automatically update users.name to match.

CREATE OR REPLACE FUNCTION sync_employee_name_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.users
      SET name = NEW.name,
          updated_at = NOW()
      WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_employee_name_to_user ON public.employees;

CREATE TRIGGER trg_sync_employee_name_to_user
  AFTER UPDATE OF name ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_name_to_user();


-- ─── Trigger 2: users.name → employees.name ───────────────────────────────
-- When a user's name is updated (e.g. from Settings > User Management),
-- automatically update the linked employee record's name.

CREATE OR REPLACE FUNCTION sync_user_name_to_employee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.employees
      SET name = NEW.name,
          updated_at = NOW()
      WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_name_to_employee ON public.users;

CREATE TRIGGER trg_sync_user_name_to_employee
  AFTER UPDATE OF name ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_name_to_employee();


-- ─── Verify ────────────────────────────────────────────────────────────────
SELECT
  trigger_name,
  event_object_table AS "table",
  event_manipulation AS "event",
  action_timing      AS "timing"
FROM information_schema.triggers
WHERE trigger_name IN (
  'trg_sync_employee_name_to_user',
  'trg_sync_user_name_to_employee'
)
ORDER BY event_object_table;
`;

async function main() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL.");

  try {
    const result = await client.query(SQL);
    const rows = Array.isArray(result) ? result.at(-1)?.rows : result.rows;
    console.log("\nTriggers created successfully:");
    console.table(rows);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
