import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive(),

  SUPABASE_DATABASE_URL: z.string().min(1, "SUPABASE_DATABASE_URL is required"),

  SUPABASE_URL:              z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_ANON_KEY:         z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters"),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // ─── CORS ───────────────────────────────────────────────────────────────────
  // Comma-separated list of allowed origins (production).
  // e.g. https://dokan360.com,https://www.dokan360.com
  CORS_ORIGINS: z.string().optional(),

  // ─── Proxy ──────────────────────────────────────────────────────────────────
  // Number of trusted reverse proxies in front of the server.
  // Replit/Vercel/Nginx: set to 1.
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(1),

  // ─── Replit runtime ─────────────────────────────────────────────────────────
  // Injected automatically by Replit — used to auto-allow preview domains in CORS.
  REPLIT_DOMAINS: z.string().optional(),
  REPL_ID:        z.string().optional(),

  // ─── Error Monitoring (TASK 8) ───────────────────────────────────────────────
  // Set SENTRY_DSN to activate Sentry error reporting in production.
  // Requires @sentry/node package: pnpm --filter @workspace/api-server add @sentry/node
  // Leave unset in development — errors are logged locally via pino.
  SENTRY_DSN:         z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE:     z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`\n❌  Environment validation failed:\n${issues}\n`);
    process.exit(1);
  }

  const data = result.data as Env;

  if (data.NODE_ENV === "production") {
    if (data.SESSION_SECRET.length < 32) {
      console.error(
        "\n❌  SESSION_SECRET must be at least 32 characters in production\n",
      );
      process.exit(1);
    }

    const INSECURE_DEFAULTS = [
      "dokan360-dev-secret-change-in-prod",
      "secret",
      "changeme",
    ];
    if (INSECURE_DEFAULTS.some((d) => data.SESSION_SECRET.includes(d))) {
      console.error(
        "\n❌  SESSION_SECRET must not use a default/insecure value in production\n",
      );
      process.exit(1);
    }
  }

  return data;
}

export const env = validateEnv();

export const isProduction  = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest        = env.NODE_ENV === "test";

/**
 * Returns the list of CORS-allowed origins.
 *
 * Resolution order:
 *  1. Development → allow all (`true`)
 *  2. `CORS_ORIGINS` env var (explicit comma-separated list)
 *  3. `REPLIT_DOMAINS` env var (Replit-injected preview/deployment domains)
 *  4. Nothing matched → empty array (blocks all cross-origin requests)
 */
export function getAllowedOrigins(): string[] | true {
  if (isDevelopment) return true;

  const origins: string[] = [];

  // Explicit list wins first
  if (env.CORS_ORIGINS) {
    const explicit = env.CORS_ORIGINS
      .split(",")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
    origins.push(...explicit);
  }

  // Auto-include Replit deployment/preview domains
  if (env.REPLIT_DOMAINS) {
    const replitDomains = env.REPLIT_DOMAINS
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
      .map((d) => (d.startsWith("http") ? d : `https://${d}`));
    origins.push(...replitDomains);
  }

  return origins.length > 0 ? [...new Set(origins)] : [];
}

/**
 * Returns the Supabase project hostname (without protocol/path).
 * Used to build CSP connect-src directives.
 * e.g. "abcdefgh.supabase.co"
 */
export function getSupabaseHost(): string | null {
  try {
    return new URL(env.SUPABASE_URL).hostname;
  } catch {
    return null;
  }
}
