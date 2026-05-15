import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  boolean,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { employeesTable } from "./employees";
import { usersTable } from "./users";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

// ─── Leave Types Table ────────────────────────────────────────────────────────
// shopId = NULL  → system-wide default (visible to all shops)
// shopId = <id>  → shop-specific custom type

export const leaveTypesTable = pgTable("leave_types", {
  id:          serial("id").primaryKey(),
  shopId:      integer("shop_id").references(() => shopsTable.id),   // nullable = global default
  name:        text("name").notNull(),
  nameBn:      text("name_bn").notNull(),
  defaultDays: integer("default_days").notNull().default(0),
  isPaid:      boolean("is_paid").notNull().default(true),
  color:       text("color").notNull().default("#10b981"),
  isActive:    boolean("is_active").notNull().default(true),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Leave Type Overrides Table ───────────────────────────────────────────────
// Per-shop override of a global default leave type.
// isHidden = true  → this shop has "deleted" this default
// field != null    → this shop has customized that field

export const leaveTypeOverridesTable = pgTable("leave_type_overrides", {
  id:          serial("id").primaryKey(),
  shopId:      integer("shop_id").references(() => shopsTable.id).notNull(),
  leaveTypeId: integer("leave_type_id").references(() => leaveTypesTable.id).notNull(),
  isHidden:    boolean("is_hidden").notNull().default(false),
  name:        text("name"),
  nameBn:      text("name_bn"),
  defaultDays: integer("default_days"),
  isPaid:      boolean("is_paid"),
  color:       text("color"),
  isActive:    boolean("is_active"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  unique("leave_type_overrides_shop_leave_type_unique").on(t.shopId, t.leaveTypeId),
]);

// ─── Leave Requests Table ─────────────────────────────────────────────────────

export const leaveRequestsTable = pgTable("leave_requests", {
  id:              serial("id").primaryKey(),
  shopId:          integer("shop_id").references(() => shopsTable.id).notNull(),
  employeeId:      integer("employee_id").references(() => employeesTable.id).notNull(),
  leaveTypeId:     integer("leave_type_id").references(() => leaveTypesTable.id).notNull(),
  fromDate:        date("from_date").notNull(),
  toDate:          date("to_date").notNull(),
  days:            integer("days").notNull(),
  reason:          text("reason"),
  status:          leaveStatusEnum("status").notNull().default("pending"),
  approvedById:    integer("approved_by_id").references(() => usersTable.id),
  approvedAt:      timestamp("approved_at", { withTimezone: true }),
  rejectedReason:  text("rejected_reason"),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── Zod insert schemas ───────────────────────────────────────────────────────

export const insertLeaveTypeSchema = createInsertSchema(leaveTypesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveTypeOverrideSchema = createInsertSchema(leaveTypeOverridesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsertLeaveType         = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveType               = typeof leaveTypesTable.$inferSelect;
export type InsertLeaveTypeOverride = z.infer<typeof insertLeaveTypeOverrideSchema>;
export type LeaveTypeOverride       = typeof leaveTypeOverridesTable.$inferSelect;
export type InsertLeaveRequest      = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest            = typeof leaveRequestsTable.$inferSelect;
export type LeaveStatus             = typeof leaveStatusEnum.enumValues[number];
