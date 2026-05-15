import { pgTable, serial, integer, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id"),
  shopId:    integer("shop_id"),
  action:    text("action").notNull(),
  ip:        text("ip"),
  userAgent: text("user_agent"),
  meta:      jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog    = typeof auditLogsTable.$inferSelect;
export type AuditAction =
  | "login_success"
  | "login_failed"
  | "login_suspicious"
  | "logout"
  | "register"
  | "token_refresh"
  | "token_refresh_failed"
  | "password_changed"
  | "user_invited"
  | "user_deactivated"
  | "user_role_changed"
  | "sale_created"
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "stock_adjusted"
  | "settings_updated";
