import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { employeesTable } from "./employees";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const scheduleTypeEnum = pgEnum("schedule_type", [
  "weekly",
  "specific_date",
  "holiday",
]);

// ─── Shifts Table ─────────────────────────────────────────────────────────────

export const shiftsTable = pgTable("shifts", {
  id:        serial("id").primaryKey(),
  shopId:    integer("shop_id").references(() => shopsTable.id).notNull(),
  name:      text("name").notNull(),
  nameBn:    text("name_bn").notNull(),
  startTime: text("start_time").notNull(), // "HH:MM" format
  endTime:   text("end_time").notNull(),   // "HH:MM" format
  color:     text("color").notNull().default("#6366f1"),
  isActive:  boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Duty Schedules Table ─────────────────────────────────────────────────────

export const dutySchedulesTable = pgTable("duty_schedules", {
  id:         serial("id").primaryKey(),
  shopId:     integer("shop_id").references(() => shopsTable.id).notNull(),
  employeeId: integer("employee_id").references(() => employeesTable.id).notNull(),
  shiftId:    integer("shift_id").references(() => shiftsTable.id),
  type:       scheduleTypeEnum("type").notNull().default("weekly"),
  weekday:    integer("weekday"),    // 0=Sunday … 6=Saturday (weekly type only)
  date:       date("date"),          // specific_date / holiday type only
  note:       text("note"),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Zod insert schemas ───────────────────────────────────────────────────────

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDutyScheduleSchema = createInsertSchema(dutySchedulesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsertShift        = z.infer<typeof insertShiftSchema>;
export type Shift              = typeof shiftsTable.$inferSelect;
export type InsertDutySchedule = z.infer<typeof insertDutyScheduleSchema>;
export type DutySchedule       = typeof dutySchedulesTable.$inferSelect;
export type ScheduleType       = typeof scheduleTypeEnum.enumValues[number];
