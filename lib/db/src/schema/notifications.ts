import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";
import { usersTable } from "./users";

export const notificationsTable = pgTable("notifications", {
  id:         serial("id").primaryKey(),
  shopId:     integer("shop_id").references(() => shopsTable.id).notNull(),
  userId:     integer("user_id").references(() => usersTable.id),
  type:       text("type").notNull(),
  title:      text("title").notNull(),
  body:       text("body"),
  entityType: text("entity_type"),
  entityId:   integer("entity_id"),
  isRead:     boolean("is_read").notNull().default(false),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NotificationType = "low_stock" | "due_alert" | "sale_alert" | "system";
