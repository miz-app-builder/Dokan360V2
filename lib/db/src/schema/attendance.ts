import { pgTable, pgEnum, serial, integer, date, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { employeesTable } from "./employees";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "half_day",
  "holiday",
  "leave",
]);

export const attendanceTable = pgTable("attendance_records", {
  id:              serial("id").primaryKey(),
  shopId:          integer("shop_id").references(() => shopsTable.id).notNull(),
  employeeId:      integer("employee_id").references(() => employeesTable.id).notNull(),
  date:            date("date").notNull(),
  checkIn:         timestamp("check_in",  { withTimezone: true }),
  checkOut:        timestamp("check_out", { withTimezone: true }),
  status:          attendanceStatusEnum("status").notNull().default("present"),
  lateMinutes:     integer("late_minutes").notNull().default(0),
  overtimeMinutes: integer("overtime_minutes").notNull().default(0),
  note:            text("note"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance       = typeof attendanceTable.$inferSelect;
export type AttendanceStatus = typeof attendanceStatusEnum.enumValues[number];
