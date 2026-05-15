import { db, auditLogsTable } from "@workspace/db";
import { logger } from "../../common/logger";
import type { AuditAction } from "@workspace/db";

interface AuditContext {
  userId?:   number | null;
  shopId?:   number | null;
  ip?:       string | null;
  userAgent?: string | null;
  meta?:     Record<string, unknown>;
}

export async function logAudit(
  action: AuditAction,
  ctx: AuditContext,
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      action,
      userId:    ctx.userId    ?? null,
      shopId:    ctx.shopId    ?? null,
      ip:        ctx.ip        ?? null,
      userAgent: ctx.userAgent ?? null,
      meta:      ctx.meta      ?? null,
    });

    logger.info(
      { action, userId: ctx.userId, shopId: ctx.shopId, ip: ctx.ip },
      `audit: ${action}`,
    );
  } catch (err) {
    logger.error({ err, action }, "audit: failed to write audit log");
  }
}
