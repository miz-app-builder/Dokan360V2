import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";

export const salaryGradesTable = pgTable("salary_grades", {
  id:               serial("id").primaryKey(),
  shopId:           integer("shop_id").references(() => shopsTable.id).notNull(),
  name:             text("name").notNull(),
  description:      text("description"),
  basicPercent:     numeric("basic_percent",      { precision: 5, scale: 2 }).notNull().default("60"),
  houseRentPercent: numeric("house_rent_percent", { precision: 5, scale: 2 }).notNull().default("25"),
  medicalPercent:   numeric("medical_percent",    { precision: 5, scale: 2 }).notNull().default("5"),
  transportPercent: numeric("transport_percent",  { precision: 5, scale: 2 }).notNull().default("5"),
  foodPercent:      numeric("food_percent",       { precision: 5, scale: 2 }).notNull().default("5"),
  otherPercent:     numeric("other_percent",      { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SalaryGrade = typeof salaryGradesTable.$inferSelect;
export type InsertSalaryGrade = typeof salaryGradesTable.$inferInsert;
