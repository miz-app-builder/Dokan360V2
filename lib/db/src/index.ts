import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. Add it to your Replit Secrets.",
  );
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis:              120_000,
  connectionTimeoutMillis:          5_000,
  keepAlive:                         true,
  keepAliveInitialDelayMillis:     10_000,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export * from "./schema";
