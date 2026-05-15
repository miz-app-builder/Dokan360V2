import type { ElementType } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  BarChart3,
  UserCheck,
  ClipboardList,
  Settings2,
} from "lucide-react";

/* ─── Module keys ───────────────────────────────────────────────── */
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

/* ─── UI maps ───────────────────────────────────────────────────── */
export const MODULE_ICONS: Record<ModuleKey, ElementType> = {
  dashboard:  LayoutDashboard,
  pos:        ShoppingCart,
  sales:      FileText,
  products:   Package,
  inventory:  Boxes,
  customers:  Users,
  suppliers:  Truck,
  purchases:  ShoppingBag,
  reports:    BarChart3,
  employees:  UserCheck,
  audit_logs: ClipboardList,
  settings:   Settings2,
};

export const MODULE_COLORS: Record<ModuleKey, string> = {
  dashboard:  "text-primary bg-primary/10",
  pos:        "text-emerald-600 bg-emerald-500/10",
  sales:      "text-orange-600 bg-orange-500/10",
  products:   "text-blue-600 bg-blue-500/10",
  inventory:  "text-violet-600 bg-violet-500/10",
  customers:  "text-cyan-600 bg-cyan-500/10",
  suppliers:  "text-indigo-600 bg-indigo-500/10",
  purchases:  "text-purple-600 bg-purple-500/10",
  reports:    "text-teal-600 bg-teal-500/10",
  employees:  "text-amber-600 bg-amber-500/10",
  audit_logs: "text-slate-600 bg-slate-500/10",
  settings:   "text-rose-600 bg-rose-500/10",
};

/* Modules without an entry here have no granular sub-permissions */
export const MODULE_SUB_PERMS: Partial<Record<ModuleKey, string[]>> = {
  pos:        ["pos.use", "pos.apply_discount"],
  sales:      ["sales.view", "sales.create", "sales.delete"],
  products:   ["products.view", "products.create", "products.update", "products.delete"],
  inventory:  ["inventory.view", "inventory.adjust"],
  customers:  ["customers.view", "customers.create", "customers.update", "customers.delete"],
  suppliers:  ["suppliers.view", "suppliers.create", "suppliers.update"],
  purchases:  ["purchases.view", "purchases.create"],
  reports:    ["reports.view", "reports.export"],
  settings:   ["settings.view", "settings.update"],
};

export const ROLE_BADGE_COLORS: Record<string, string> = {
  admin:  "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  seller: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  viewer: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

/* ─── Data interface ────────────────────────────────────────────── */
export interface UserAccessItem {
  userId:          number;
  name:            string;
  email:           string;
  role:            string;
  isActive:        boolean;
  allowedModules:  string[];
  dataRestriction: string;
  hasOverride:     boolean;
}

/* ─── Pure helper functions ─────────────────────────────────────── */
export function getModuleState(
  mod: ModuleKey,
  modules: Set<string>,
): "enabled" | "partial" | "disabled" {
  if (modules.has(mod)) return "enabled";
  const subPerms = MODULE_SUB_PERMS[mod];
  if (!subPerms) return "disabled";
  const count = subPerms.filter((p) => modules.has(p)).length;
  if (count === 0) return "disabled";
  if (count === subPerms.length) return "enabled";
  return "partial";
}

export function isSubPermEnabled(
  perm: string,
  mod: ModuleKey,
  modules: Set<string>,
): boolean {
  if (modules.has(mod)) return true;
  return modules.has(perm);
}

export function getEnabledSubCount(mod: ModuleKey, modules: Set<string>): number {
  const subPerms = MODULE_SUB_PERMS[mod];
  if (!subPerms) return 0;
  if (modules.has(mod)) return subPerms.length;
  return subPerms.filter((p) => modules.has(p)).length;
}

export function buildSelectAllModules(): Set<string> {
  const all = new Set<string>();
  MODULE_KEYS.forEach((mod) => {
    const subPerms = MODULE_SUB_PERMS[mod];
    if (subPerms) {
      subPerms.forEach((p) => all.add(p));
    } else {
      all.add(mod);
    }
  });
  return all;
}
