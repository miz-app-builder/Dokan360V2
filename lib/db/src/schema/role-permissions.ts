import { pgTable, serial, integer, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";

export const userRolesTable = pgTable("user_roles", {
  id:        text("id").primaryKey(),
  shopId:    integer("shop_id").references(() => shopsTable.id).notNull(),
  label:     text("label").notNull(),
  baseRole:  text("base_role").notNull().default(""),
  dotIdx:    integer("dot_idx").notNull().default(0),
  isBuiltin: boolean("is_builtin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserRoleRecord = typeof userRolesTable.$inferSelect;
export type CustomRole     = UserRoleRecord;

export const customRolesTable = userRolesTable;

export const ROLE_CATEGORIES = [
  "super_admin",
  "shop_admin",
  "manager",
  "accountant",
  "hr_manager",
  "inventory_manager",
  "sales_manager",
  "cashier",
  "seller",
  "viewer",
] as const;

export type RoleCategory = typeof ROLE_CATEGORIES[number];

export const PERMISSION_KEYS = [
  "dashboard.view",
  "pos.use",
  "pos.apply_discount",
  "sales.view",
  "sales.create",
  "sales.delete",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.view",
  "inventory.adjust",
  "customers.view",
  "customers.create",
  "customers.update",
  "customers.delete",
  "suppliers.view",
  "suppliers.create",
  "suppliers.update",
  "purchases.view",
  "purchases.create",
  "reports.view",
  "reports.export",
  "audit_logs.view",
  "settings.view",
  "settings.update",
  "users.view",
  "users.invite",
  "users.deactivate",
] as const;

export type PermissionKey = typeof PERMISSION_KEYS[number];

export const rolePermissionsTable = pgTable("role_permissions", {
  id:           serial("id").primaryKey(),
  shopId:       integer("shop_id").references(() => shopsTable.id).notNull(),
  roleCategory: text("role_category").notNull(),
  permissions:  text("permissions").notNull().default("{}"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  uniq: unique("role_permissions_shop_role_unique").on(t.shopId, t.roleCategory),
}));

export type RolePermission = typeof rolePermissionsTable.$inferSelect;

export const DEFAULT_PERMISSIONS: Record<RoleCategory, PermissionKey[]> = {
  super_admin: PERMISSION_KEYS.slice() as unknown as PermissionKey[],
  shop_admin:  PERMISSION_KEYS.slice() as unknown as PermissionKey[],
  manager: [
    "dashboard.view", "pos.use", "pos.apply_discount",
    "sales.view", "sales.create",
    "products.view", "products.create", "products.update",
    "inventory.view", "inventory.adjust",
    "customers.view", "customers.create", "customers.update",
    "suppliers.view", "purchases.view",
    "reports.view", "audit_logs.view", "settings.view", "users.view",
  ],
  accountant: [
    "dashboard.view", "sales.view", "reports.view", "reports.export",
    "customers.view", "purchases.view", "audit_logs.view", "settings.view",
  ],
  hr_manager: [
    "dashboard.view", "users.view", "users.invite", "users.deactivate",
    "audit_logs.view", "settings.view",
  ],
  inventory_manager: [
    "dashboard.view", "products.view", "products.create", "products.update",
    "inventory.view", "inventory.adjust",
    "suppliers.view", "suppliers.create", "suppliers.update",
    "purchases.view", "purchases.create",
    "reports.view", "settings.view",
  ],
  sales_manager: [
    "dashboard.view", "pos.use", "pos.apply_discount",
    "sales.view", "sales.create",
    "customers.view", "customers.create", "customers.update",
    "products.view", "inventory.view",
    "reports.view", "settings.view",
  ],
  cashier: [
    "dashboard.view", "pos.use",
    "sales.view", "sales.create",
    "customers.view", "products.view", "inventory.view",
  ],
  seller: [
    "dashboard.view", "pos.use",
    "sales.view", "sales.create",
    "products.view", "inventory.view", "customers.view",
  ],
  viewer: [
    "dashboard.view", "sales.view", "products.view",
    "inventory.view", "customers.view", "reports.view",
  ],
};

export const BUILTIN_ROLE_LABELS: Record<RoleCategory, string> = {
  super_admin:       "Super Admin",
  shop_admin:        "Shop Admin",
  manager:           "Manager",
  accountant:        "Accountant",
  hr_manager:        "HR Manager",
  inventory_manager: "Inventory Manager",
  sales_manager:     "Sales Manager",
  cashier:           "Cashier",
  seller:            "Seller",
  viewer:            "Viewer",
};
