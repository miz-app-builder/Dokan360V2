import { Client } from "pg";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("SUPABASE_DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run(): Promise<void> {
  await client.connect();
  console.log("Connected to database");

  try {
    await client.query("BEGIN");

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."attendance_status" AS ENUM(
          'present', 'absent', 'late', 'half_day', 'holiday', 'leave'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("✓ attendance_status enum ready");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "attendance_records" (
        "id"               serial PRIMARY KEY NOT NULL,
        "shop_id"          integer NOT NULL REFERENCES "shops"("id"),
        "employee_id"      integer NOT NULL REFERENCES "employees"("id"),
        "date"             date NOT NULL,
        "check_in"         timestamp with time zone,
        "check_out"        timestamp with time zone,
        "status"           "attendance_status" NOT NULL DEFAULT 'present',
        "late_minutes"     integer NOT NULL DEFAULT 0,
        "overtime_minutes" integer NOT NULL DEFAULT 0,
        "note"             text,
        "created_at"       timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at"       timestamp with time zone DEFAULT now() NOT NULL,
        UNIQUE ("employee_id", "date")
      );
    `);
    console.log("✓ attendance_records table ready");

    await client.query(`
      CREATE INDEX IF NOT EXISTS "attendance_shop_idx"     ON "attendance_records"("shop_id");
      CREATE INDEX IF NOT EXISTS "attendance_employee_idx" ON "attendance_records"("employee_id");
      CREATE INDEX IF NOT EXISTS "attendance_date_idx"     ON "attendance_records"("date");
    `);
    console.log("✓ indexes ready");

    await client.query("COMMIT");
    console.log("✅ Attendance schema applied successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
