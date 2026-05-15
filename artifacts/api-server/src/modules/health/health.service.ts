import { pool } from "@workspace/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbCheck {
  status: "ok" | "down";
  latencyMs?: number;
  error?: string;
}

export interface HealthStatus {
  status: "ok";
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadyStatus {
  status: "ok" | "down";
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    database: DbCheck;
  };
}

// ─── Uptime ───────────────────────────────────────────────────────────────────

const START_TIME = Date.now();

function uptimeSeconds(): number {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

// ─── DB check ────────────────────────────────────────────────────────────────

export async function checkDatabase(): Promise<DbCheck> {
  const t0 = Date.now();
  try {
    await pool.query("SELECT 1");
    return { status: "ok", latencyMs: Date.now() - t0 };
  } catch (err) {
    return {
      status: "down",
      error: err instanceof Error ? err.message : "Unknown database error",
    };
  }
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** /health & /healthz — server is up, no deep checks */
export function getHealth(): HealthStatus {
  return {
    status: "ok",
    uptimeSeconds: uptimeSeconds(),
    timestamp: new Date().toISOString(),
  };
}

/** /live — process is alive (no external dependency checks) */
export function getLive(): HealthStatus {
  return {
    status: "ok",
    uptimeSeconds: uptimeSeconds(),
    timestamp: new Date().toISOString(),
  };
}

/** /ready — service can handle traffic (checks DB connectivity) */
export async function getReady(): Promise<ReadyStatus> {
  const database = await checkDatabase();
  return {
    status: database.status === "ok" ? "ok" : "down",
    uptimeSeconds: uptimeSeconds(),
    timestamp: new Date().toISOString(),
    checks: { database },
  };
}
