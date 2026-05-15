import type { ElementType } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Users,
  Truck,
  ShoppingBag,
  BarChart3,
  ClipboardList,
  Settings2,
  UserCog,
} from "lucide-react";

/* ─── Built-in roles ─────────────────────────────────────────────── */
export const BUILT_IN_ROLES = [
  "super_admin", "shop_admin", "manager", "accountant", "hr_manager",
  "inventory_manager", "sales_manager", "cashier", "seller", "viewer",
] as const;

export type BuiltInRole = (typeof BUILT_IN_ROLES)[number];

/* ─── Visual identity maps ───────────────────────────────────────── */
export const ROLE_DOT: Record<string, string> = {
  super_admin:       "bg-violet-500",
  shop_admin:        "bg-violet-400",
  manager:           "bg-blue-500",
  accountant:        "bg-emerald-500",
  hr_manager:        "bg-orange-500",
  inventory_manager: "bg-amber-500",
  sales_manager:     "bg-cyan-500",
  cashier:           "bg-teal-500",
  seller:            "bg-sky-500",
  viewer:            "bg-slate-400",
};

export const CUSTOM_DOT_PALETTE = [
  "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-indigo-500",
  "bg-lime-500", "bg-red-500", "bg-purple-500", "bg-green-500",
];

export const ROLE_BADGE: Record<string, string> = {
  super_admin:       "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  shop_admin:        "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  manager:           "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  accountant:        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  hr_manager:        "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  inventory_manager: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  sales_manager:     "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
  cashier:           "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  seller:            "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  viewer:            "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
};

/* ─── Permission groups ──────────────────────────────────────────── */
export const PERMISSION_GROUPS: Record<string, { perms: string[]; Icon: ElementType }> = {
  dashboard:  { perms: ["dashboard.view"],                                                          Icon: LayoutDashboard },
  pos:        { perms: ["pos.use", "pos.apply_discount"],                                          Icon: ShoppingCart },
  sales:      { perms: ["sales.view", "sales.create", "sales.delete"],                            Icon: Receipt },
  products:   { perms: ["products.view", "products.create", "products.update", "products.delete"], Icon: Package },
  inventory:  { perms: ["inventory.view", "inventory.adjust"],                                     Icon: Boxes },
  customers:  { perms: ["customers.view", "customers.create", "customers.update", "customers.delete"], Icon: Users },
  suppliers:  { perms: ["suppliers.view", "suppliers.create", "suppliers.update"],                 Icon: Truck },
  purchases:  { perms: ["purchases.view", "purchases.create"],                                     Icon: ShoppingBag },
  reports:    { perms: ["reports.view", "reports.export"],                                         Icon: BarChart3 },
  audit_logs: { perms: ["audit_logs.view"],                                                         Icon: ClipboardList },
  settings:   { perms: ["settings.view", "settings.update"],                                       Icon: Settings2 },
  users:      { perms: ["users.view", "users.invite", "users.deactivate"],                        Icon: UserCog },
};

export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flatMap((g) => g.perms);

/* ─── Helpers ────────────────────────────────────────────────────── */
export function makeRoleId(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[\u0980-\u09FF]+/g, (m) => `bn_${m.codePointAt(0)}`)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return (slug || "custom") + "_" + Date.now().toString(36);
}
