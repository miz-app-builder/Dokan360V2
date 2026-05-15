import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { suppliersTable } from "./suppliers";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const purchasesTable = pgTable("purchases", {
  id:            serial("id").primaryKey(),
  shopId:        integer("shop_id").references(() => shopsTable.id).notNull(),
  supplierId:    integer("supplier_id").references(() => suppliersTable.id),
  userId:        integer("user_id").references(() => usersTable.id),
  invoiceNumber: text("invoice_number").notNull(),
  total:         numeric("total", { precision: 12, scale: 2 }).notNull(),
  paid:          numeric("paid", { precision: 12, scale: 2 }).notNull(),
  due:           numeric("due", { precision: 12, scale: 2 }).notNull().default("0"),
  note:          text("note"),
  status:        text("status").notNull().default("received"),
  purchasedAt:   timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const purchaseItemsTable = pgTable("purchase_items", {
  id:            serial("id").primaryKey(),
  purchaseId:    integer("purchase_id").references(() => purchasesTable.id).notNull(),
  productId:     integer("product_id").references(() => productsTable.id),
  productNameBn: text("product_name_bn").notNull(),
  quantity:      numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  costPrice:     numeric("cost_price", { precision: 12, scale: 2 }).notNull(),
  subtotal:      numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
export type PurchaseItem = typeof purchaseItemsTable.$inferSelect;
