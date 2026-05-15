import { gte, lte, ilike, SQL } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

/**
 * Builds drizzle date range conditions for any date column.
 * `to` date is extended to end-of-day UTC.
 */
export function buildDateRange(
  column: PgColumn,
  from?: string,
  to?: string,
): SQL[] {
  const conds: SQL[] = [];
  if (from) conds.push(gte(column, new Date(from)));
  if (to) conds.push(lte(column, new Date(to + "T23:59:59.999Z")));
  return conds;
}

/**
 * Builds a case-insensitive ILIKE search condition.
 */
export function buildSearch(column: PgColumn, term?: string): SQL | undefined {
  if (!term?.trim()) return undefined;
  return ilike(column, `%${term.trim()}%`);
}

/**
 * Safely parses an integer ID from a string (e.g. route param).
 * Returns null if invalid.
 */
export function parseIntId(value: string | undefined): number | null {
  const n = parseInt(String(value), 10);
  return isNaN(n) || n <= 0 ? null : n;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
