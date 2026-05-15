import {
  pgTable,
  pgEnum,
  serial,
  integer,
  numeric,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable }    from "./shops";
import { employeesTable } from "./employees";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const payrollPaymentStatusEnum = pgEnum("payroll_payment_status", [
  "unpaid",
  "paid",
]);

// ─── payroll_records ──────────────────────────────────────────────────────────
// One row per employee per month/year.
// Generated from: employee.salary + attendance data + unpaid leave days.
// Editable fields: overtimePay, bonus, advance, otherDeductions, note.

export const payrollRecordsTable = pgTable("payroll_records", {
  id:                   serial("id").primaryKey(),
  shopId:               integer("shop_id").references(() => shopsTable.id).notNull(),
  employeeId:           integer("employee_id").references(() => employeesTable.id).notNull(),

  month:                integer("month").notNull(),
  year:                 integer("year").notNull(),

  // ── Snapshot ─────────────────────────────────────────────────────────────
  baseSalary:           numeric("base_salary",           { precision: 12, scale: 2 }).notNull().default("0"),

  // ── Attendance summary ────────────────────────────────────────────────────
  workingDays:          integer("working_days").notNull().default(0),
  presentDays:          integer("present_days").notNull().default(0),
  absentDays:           integer("absent_days").notNull().default(0),
  lateMinutes:          integer("late_minutes").notNull().default(0),
  overtimeMinutes:      integer("overtime_minutes").notNull().default(0),

  // ── Allowances (earnings) ─────────────────────────────────────────────────
  houseRentAllowance:    numeric("house_rent_allowance",    { precision: 12, scale: 2 }).notNull().default("0"),
  medicalAllowance:      numeric("medical_allowance",       { precision: 12, scale: 2 }).notNull().default("0"),
  transportAllowance:    numeric("transport_allowance",     { precision: 12, scale: 2 }).notNull().default("0"),
  foodAllowance:         numeric("food_allowance",          { precision: 12, scale: 2 }).notNull().default("0"),
  commission:            numeric("commission",              { precision: 12, scale: 2 }).notNull().default("0"),
  overtimePay:           numeric("overtime_pay",            { precision: 12, scale: 2 }).notNull().default("0"),
  bonus:                 numeric("bonus",                   { precision: 12, scale: 2 }).notNull().default("0"),

  // ── Deductions ────────────────────────────────────────────────────────────
  advance:               numeric("advance",                 { precision: 12, scale: 2 }).notNull().default("0"),
  otherDeductions:       numeric("other_deductions",        { precision: 12, scale: 2 }).notNull().default("0"),
  unpaidLeaveDays:       integer("unpaid_leave_days").notNull().default(0),
  unpaidLeaveDeduction:  numeric("unpaid_leave_deduction",  { precision: 12, scale: 2 }).notNull().default("0"),
  providentFundEmployee: numeric("provident_fund_employee", { precision: 12, scale: 2 }).notNull().default("0"),
  providentFundEmployer: numeric("provident_fund_employer", { precision: 12, scale: 2 }).notNull().default("0"),
  taxDeduction:          numeric("tax_deduction",           { precision: 12, scale: 2 }).notNull().default("0"),
  loanDeduction:         numeric("loan_deduction",          { precision: 12, scale: 2 }).notNull().default("0"),

  // ── Totals (calculated on generate/update) ────────────────────────────────
  grossSalary:           numeric("gross_salary",            { precision: 12, scale: 2 }).notNull().default("0"),
  netSalary:             numeric("net_salary",              { precision: 12, scale: 2 }).notNull().default("0"),

  // ── Payment ───────────────────────────────────────────────────────────────
  paymentStatus:        payrollPaymentStatusEnum("payment_status").notNull().default("unpaid"),
  paidAt:               timestamp("paid_at", { withTimezone: true }),
  note:                 text("note"),

  createdAt:            timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique("payroll_records_shop_emp_month_year_unique").on(t.shopId, t.employeeId, t.month, t.year),
]);

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const insertPayrollRecordSchema = createInsertSchema(payrollRecordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsertPayrollRecord   = z.infer<typeof insertPayrollRecordSchema>;
export type PayrollRecord         = typeof payrollRecordsTable.$inferSelect;
export type PayrollPaymentStatus  = typeof payrollPaymentStatusEnum.enumValues[number];
