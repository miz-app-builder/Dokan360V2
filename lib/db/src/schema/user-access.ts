import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";
import { usersTable } from "./users";

export const MODULE_KEYS = [
  "dashboard",
  "pos",
  "sales",
  "products",
  "inventory",
  "customers",
  "suppliers",
  "purchases",
  "reports",
  "employees",
  "audit_logs",
  "settings",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const DATA_RESTRICTIONS = ["none", "own_sales", "own_outlet"] as const;
export type DataRestriction = (typeof DATA_RESTRICTIONS)[number];

export const userModuleAccessTable = pgTable(
  "user_module_access",
  {
    id:              serial("id").primaryKey(),
    shopId:          integer("shop_id").references(() => shopsTable.id).notNull(),
    userId:          integer("user_id").references(() => usersTable.id).notNull(),
    allowedModules:  text("allowed_modules").notNull().default("[]"),
    dataRestriction: text("data_restriction").notNull().default("none"),
    createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => ({
    uniq: unique("user_module_access_shop_user_unique").on(t.shopId, t.userId),
  }),
);

export type UserModuleAccess = typeof userModuleAccessTable.$inferSelect;
