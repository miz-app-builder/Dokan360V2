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

export const rotationCycleTypeEnum = pgEnum("rotation_cycle_type", [
  "daily",
  "weekly",
  "monthly",
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

// ─── Rotation Patterns Table ──────────────────────────────────────────────────
// A rotation pattern defines how shifts cycle over days/weeks/months.
// cycleType: "daily" = N-day rotation, "weekly" = N-week rotation, "monthly" = N-month rotation
// cycleLength: how many units make up one full cycle (e.g. 2 → 2-week rotation)
// startDate: the anchor date used to calculate which slot is "now"
// isDefault: one pattern per shop can be marked default (admin convenience)

export const rotationPatternsTable = pgTable("rotation_patterns", {
  id:          serial("id").primaryKey(),
  shopId:      integer("shop_id").references(() => shopsTable.id).notNull(),
  name:        text("name").notNull(),
  nameBn:      text("name_bn").notNull(),
  cycleType:   rotationCycleTypeEnum("cycle_type").notNull().default("weekly"),
  cycleLength: integer("cycle_length").notNull().default(2),
  startDate:   date("start_date").notNull(),
  isDefault:   boolean("is_default").notNull().default(false),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Rotation Pattern Slots Table ─────────────────────────────────────────────
// Each slot defines one shift assignment within the cycle.
// slotIndex: 0-based position in the cycle (which day/week/month)
// weekday:   0-6 for weekly/monthly types; NULL for daily type
// shiftId:   NULL means this is a day-off slot

export const rotationPatternSlotsTable = pgTable("rotation_pattern_slots", {
  id:        serial("id").primaryKey(),
  patternId: integer("pattern_id").references(() => rotationPatternsTable.id, { onDelete: "cascade" }).notNull(),
  slotIndex: integer("slot_index").notNull(),
  weekday:   integer("weekday"),
  shiftId:   integer("shift_id").references(() => shiftsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Employee Rotations Table ─────────────────────────────────────────────────
// Links an employee to a rotation pattern for a time range.
// endDate NULL = currently active assignment

export const employeeRotationsTable = pgTable("employee_rotations", {
  id:         serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employeesTable.id).notNull(),
  patternId:  integer("pattern_id").references(() => rotationPatternsTable.id).notNull(),
  startDate:  date("start_date").notNull(),
  endDate:    date("end_date"),
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

export const insertRotationPatternSchema = createInsertSchema(rotationPatternsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRotationPatternSlotSchema = createInsertSchema(rotationPatternSlotsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeRotationSchema = createInsertSchema(employeeRotationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsertShift              = z.infer<typeof insertShiftSchema>;
export type Shift                    = typeof shiftsTable.$inferSelect;
export type InsertDutySchedule       = z.infer<typeof insertDutyScheduleSchema>;
export type DutySchedule             = typeof dutySchedulesTable.$inferSelect;
export type ScheduleType             = typeof scheduleTypeEnum.enumValues[number];
export type RotationCycleType        = typeof rotationCycleTypeEnum.enumValues[number];
export type RotationPattern          = typeof rotationPatternsTable.$inferSelect;
export type InsertRotationPattern    = z.infer<typeof insertRotationPatternSchema>;
export type RotationPatternSlot      = typeof rotationPatternSlotsTable.$inferSelect;
export type InsertRotationPatternSlot = z.infer<typeof insertRotationPatternSlotSchema>;
export type EmployeeRotation         = typeof employeeRotationsTable.$inferSelect;
export type InsertEmployeeRotation   = z.infer<typeof insertEmployeeRotationSchema>;
