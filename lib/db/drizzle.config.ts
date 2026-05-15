import { defineConfig } from "drizzle-kit";
import path from "path";

const connectionString = process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL must be set — add it to your Replit Secrets");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),

  // Migration files output directory.
  // • `drizzle-kit generate` creates SQL migration files here.
  // • `drizzle-kit migrate` runs those files against the DB (production-safe).
  // • `drizzle-kit push` (dev only) applies schema directly, no migration files.
  out: path.join(__dirname, "./migrations"),

  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: "require",
  },
});
