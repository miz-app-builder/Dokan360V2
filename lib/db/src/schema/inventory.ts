import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const inventoryAdjustmentsTable = pgTable("inventory_adjustments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => productsTable.id).notNull(),
  productNameBn: text("product_name_bn").notNull(),
  quantity: integer("quantity").notNull(),
  type: text("type").notNull(),
  reason: text("reason"),
  userId: integer("user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustmentsTable).omit({ id: true, createdAt: true });
export type InsertInventoryAdjustment = z.infer<typeof insertInventoryAdjustmentSchema>;
export type InventoryAdjustment = typeof inventoryAdjustmentsTable.$inferSelect;
