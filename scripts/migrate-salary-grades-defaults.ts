import { Pool } from "pg";

const url = process.env.SUPABASE_DATABASE_URL;
if (!url) throw new Error("SUPABASE_DATABASE_URL is not set");

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Make shop_id nullable (support system defaults with NULL shop_id)
    await client.query(`
      ALTER TABLE salary_grades
        ALTER COLUMN shop_id DROP NOT NULL
    `);
    console.log("✓ shop_id is now nullable");

    // 2. Add is_system_default column if it doesn't exist
    await client.query(`
      ALTER TABLE salary_grades
        ADD COLUMN IF NOT EXISTS is_system_default boolean NOT NULL DEFAULT false
    `);
    console.log("✓ is_system_default column added");

    // 3. Seed system default grades (only if none exist yet)
    const { rowCount } = await client.query(
      "SELECT 1 FROM salary_grades WHERE is_system_default = true LIMIT 1"
    );

    if ((rowCount ?? 0) === 0) {
      await client.query(`
        INSERT INTO salary_grades
          (shop_id, is_system_default, name, description,
           basic_percent, house_rent_percent, medical_percent,
           transport_percent, food_percent, other_percent)
        VALUES
          (NULL, true, 'গ্রেড-এ (সিনিয়র)', 'সিনিয়র কর্মীদের জন্য উচ্চ বেতন কাঠামো',  '60','25','5','5','5','0'),
          (NULL, true, 'গ্রেড-বি (মিড)',     'মধ্যম পর্যায়ের কর্মীদের বেতন কাঠামো',    '55','25','7','7','6','0'),
          (NULL, true, 'গ্রেড-সি (জুনিয়র)', 'জুনিয়র কর্মীদের বেতন কাঠামো',           '50','30','8','7','5','0'),
          (NULL, true, 'গ্রেড-ডি (এন্ট্রি)', 'নতুন ও এন্ট্রি লেভেল কর্মীদের বেতন কাঠামো','50','28','8','8','6','0')
      `);
      console.log("✓ 4 system default salary grades seeded");
    } else {
      console.log("✓ System default grades already exist — skipped seeding");
    }

    await client.query("COMMIT");
    console.log("\n✅ Migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
