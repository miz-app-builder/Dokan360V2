import { pgTable, text, serial, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopsTable = pgTable("shops", {
  id:            serial("id").primaryKey(),
  name:          text("name").notNull(),
  address:       text("address"),
  phone:         text("phone"),
  email:         text("email"),
  website:       text("website"),
  currency:      text("currency").notNull().default("BDT"),
  taxNumber:     text("tax_number"),
  taxRate:       numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  invoiceNote:   text("invoice_note"),
  logo:          text("logo"),
  createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
