import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetRolePermissions,
  useUpdateRolePermissions,
  useResetRolePermissions,
  getGetRolePermissionsQueryKey,
  useListCustomRoles,
  useCreateCustomRole,
  useDeleteCustomRole,
  getListCustomRolesQueryKey,
  type CustomRoleItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldCheck, RotateCcw, Save, Lock, Plus, Trash2,
  LayoutDashboard, ShoppingCart, Receipt, Package, Boxes,
  Users, Truck, ShoppingBag, BarChart3, ClipboardList, Settings2,
  UserCog, CheckCheck, Square, ChevronDown,
} from "lucide-react";

/* ─── Constants ───────────────────────────────────────────────── */
const BUILT_IN_ROLE_IDS = [
  "super_admin", "shop_admin", "manager", "accountant", "hr_manager",
  "inventory_manager", "sales_manager", "cashier", "seller", "viewer",
] as const;

type BuiltInRole = typeof BUILT_IN_ROLE_IDS[number];
const BUILT_IN_ROLES = BUILT_IN_ROLE_IDS;

const ROLE_DOT: Record<string, string> = {
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

const CUSTOM_DOT_PALETTE = [
  "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-indigo-500",
  "bg-lime-500", "bg-red-500", "bg-purple-500", "bg-green-500",
];

const ROLE_BADGE: Record<string, string> = {
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

const PERMISSION_GROUPS: Record<string, { perms: string[]; Icon: React.ElementType }> = {
  dashboard:   { perms: ["dashboard.view"],                                                          Icon: LayoutDashboard },
  pos:         { perms: ["pos.use", "pos.apply_discount"],                                          Icon: ShoppingCart },
  sales:       { perms: ["sales.view", "sales.create", "sales.delete"],                            Icon: Receipt },
  products:    { perms: ["products.view", "products.create", "products.update", "products.delete"], Icon: Package },
  inventory:   { perms: ["inventory.view", "inventory.adjust"],                                     Icon: Boxes },
  customers:   { perms: ["customers.view", "customers.create", "customers.update", "customers.delete"], Icon: Users },
  suppliers:   { perms: ["suppliers.view", "suppliers.create", "suppliers.update"],                 Icon: Truck },
  purchases:   { perms: ["purchases.view", "purchases.create"],                                     Icon: ShoppingBag },
  reports:     { perms: ["reports.view", "reports.export"],                                         Icon: BarChart3 },
  audit_logs:  { perms: ["audit_logs.view"],                                                         Icon: ClipboardList },
  settings:    { perms: ["settings.view", "settings.update"],                                        Icon: Settings2 },
  users:       { perms: ["users.view", "users.invite", "users.deactivate"],                         Icon: UserCog },
};

const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flatMap((g) => g.perms);

/* ─── Helpers ────────────────────────────────────────────────────── */
function makeRoleId(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[\u0980-\u09FF]+/g, (m) => `bn_${m.codePointAt(0)}`)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return (slug || "custom") + "_" + Date.now().toString(36);
}

/* ─── Add Role dialog ────────────────────────────────────────────── */
function AddRoleDialog({
  open,
  onClose,
  onCreated,
  existingCount,
  matrix,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (data: { id: string; label: string; baseRole: string; dotIdx: number; initPerms: Record<string, boolean> }) => void;
  existingCount: number;
  matrix: Record<string, Record<string, boolean>>;
}) {
  const { t } = useTranslation();
  const NO_BASE = "__none__";
  const [label, setLabel] = useState("");
  const [quickFill, setQuickFill] = useState(NO_BASE);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((p) => { init[p] = false; });
    return init;
  });

  useEffect(() => {
    if (!open) {
      setLabel("");
      setQuickFill(NO_BASE);
      setOpenGroups(new Set());
      const init: Record<string, boolean> = {};
      ALL_PERMISSIONS.forEach((p) => { init[p] = false; });
      setLocalPerms(init);
    }
  }, [open]);

  function handleQuickFill(role: string) {
    setQuickFill(role);
    const init: Record<string, boolean> = {};
    if (role !== NO_BASE && matrix[role]) {
      ALL_PERMISSIONS.forEach((p) => { init[p] = matrix[role][p] ?? false; });
    } else {
      ALL_PERMISSIONS.forEach((p) => { init[p] = false; });
    }
    setLocalPerms(init);
  }

  function handleTogglePerm(perm: string) {
    setLocalPerms((prev) => ({ ...prev, [perm]: !prev[perm] }));
    if (quickFill !== NO_BASE) setQuickFill(NO_BASE);
  }

  function handleToggleGroup(group: string, value: boolean) {
    const perms = PERMISSION_GROUPS[group]?.perms ?? [];
    setLocalPerms((prev) => {
      const next = { ...prev };
      perms.forEach((p) => { next[p] = value; });
      return next;
    });
    if (quickFill !== NO_BASE) setQuickFill(NO_BASE);
  }

  function toggleOpenGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = makeRoleId(trimmed);
    const dotIdx = existingCount % CUSTOM_DOT_PALETTE.length;
    const selectedBase = quickFill === NO_BASE ? "" : quickFill;
    onCreated({ id, label: trimmed, baseRole: selectedBase, dotIdx, initPerms: { ...localPerms } });
    onClose();
  }

  const totalGranted = ALL_PERMISSIONS.filter((p) => localPerms[p]).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            {t("settings.addRole")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Role name */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t("settings.newRoleName")} *</Label>
            <Input
              className="h-10 rounded-xl"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("settings.newRoleNamePlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          {/* Permissions section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t("settings.permissionsSection")}</Label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border leading-none ${
                  totalGranted === ALL_PERMISSIONS.length
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : totalGranted > 0
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border/40"
                }`}>
                  {totalGranted}/{ALL_PERMISSIONS.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{t("settings.quickFillFrom")}:</span>
                <Select value={quickFill} onValueChange={handleQuickFill}>
                  <SelectTrigger className="h-7 text-[11px] rounded-lg w-36 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="__none__">{t("settings.newRoleBaseNone")}</SelectItem>
                    {BUILT_IN_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`settings.roleCategory_${r}`, r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permission accordion (scrollable) */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
              {Object.entries(PERMISSION_GROUPS).map(([group, { perms, Icon }]) => {
                const granted = perms.filter((p) => localPerms[p]).length;
                const allOn = granted === perms.length;
                const isOpen = openGroups.has(group);
                return (
                  <div key={group} className="rounded-xl border border-border/50 overflow-hidden">
                    <div
                      className="flex items-center justify-between px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer select-none"
                      onClick={() => toggleOpenGroup(group)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                          {t(`settings.permGroup_${group}`, group)}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border leading-none ${
                          allOn
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : granted > 0
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            : "bg-muted text-muted-foreground border-border/40"
                        }`}>
                          {granted}/{perms.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleGroup(group, !allOn); }}
                          className="text-[10px] font-medium text-primary hover:text-primary/80 px-2 py-0.5 rounded-md hover:bg-primary/8 flex items-center gap-1 transition-colors"
                        >
                          {allOn
                            ? <><Square className="h-2.5 w-2.5" />{t("settings.userAccessDeselectAll")}</>
                            : <><CheckCheck className="h-2.5 w-2.5" />{t("settings.userAccessSelectAll")}</>
                          }
                        </button>
                        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="divide-y divide-border/30 border-t border-border/40 bg-card">
                        {perms.map((perm) => (
                          <div key={perm} className="flex items-center justify-between px-3.5 py-2 hover:bg-muted/20 transition-colors">
                            <span className="text-sm text-foreground/80">
                              {t(`settings.perm_${perm}`, perm)}
                            </span>
                            <Switch
                              checked={localPerms[perm] ?? false}
                              onCheckedChange={() => handleTogglePerm(perm)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>{t("common.cancel")}</Button>
          <Button className="rounded-xl gap-2" onClick={handleCreate} disabled={!label.trim()}>
            <Plus className="h-3.5 w-3.5" />
            {t("settings.createRoleBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Permission group card (accordion) ─────────────────────────── */
function PermGroupCard({
  group,
  perms,
  Icon,
  localPerms,
  isAdmin,
  saving,
  resetting,
  onToggle,
  onToggleGroup,
  defaultOpen = false,
}: {
  group: string;
  perms: string[];
  Icon: React.ElementType;
  localPerms: Record<string, boolean>;
  isAdmin: boolean;
  saving: boolean;
  resetting: boolean;
  onToggle: (perm: string) => void;
  onToggleGroup: (group: string, value: boolean) => void;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const granted = perms.filter((p) => localPerms[p]).length;
  const allOn   = granted === perms.length;

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Group header — click to toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
            {t(`settings.permGroup_${group}`, group)}
          </span>
          {granted > 0 && (
            <span className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20 leading-none">
              {granted}/{perms.length}
            </span>
          )}
          {granted === 0 && (
            <span className="text-[10px] text-muted-foreground/50 tabular-nums">
              0/{perms.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isAdmin && open && (
            <div
              role="button"
              tabIndex={0}
              className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded-md hover:bg-primary/8 flex items-center gap-1 cursor-pointer"
              onClick={() => onToggleGroup(group, !allOn)}
              onKeyDown={(e) => e.key === "Enter" && onToggleGroup(group, !allOn)}
              title={allOn ? t("settings.deselectAllGroup") : t("settings.selectAllGroup")}
            >
              {allOn
                ? <><CheckCheck className="h-3 w-3" />{t("settings.deselectAllGroup")}</>
                : <><Square className="h-3 w-3" />{t("settings.selectAllGroup")}</>}
            </div>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Permission rows — shown only when open */}
      {open && (
        <div className="divide-y divide-border/30 border-t border-border/40">
          {perms.map((perm) => (
            <div key={perm} className="flex items-center justify-between px-3.5 py-2.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2">
                {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />}
                <span className="text-sm text-foreground/80">
                  {t(`settings.perm_${perm}`, perm)}
                </span>
              </div>
              <Switch
                checked={localPerms[perm] ?? false}
                onCheckedChange={() => onToggle(perm)}
                disabled={!isAdmin || saving || resetting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Role list item ─────────────────────────────────────────────── */
function RoleListItem({
  roleId,
  label,
  dot,
  badgeClass,
  grantedCount,
  totalCount,
  isSelected,
  isCustom,
  isAdmin,
  onClick,
  onDelete,
}: {
  roleId: string;
  label: string;
  dot: string;
  badgeClass?: string;
  grantedCount: number;
  totalCount: number;
  isSelected: boolean;
  isCustom: boolean;
  isAdmin: boolean;
  onClick: () => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const pct = totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group relative ${
        isSelected
          ? "bg-primary/10 border border-primary/30 shadow-sm"
          : "hover:bg-muted/60 border border-transparent"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
              {label}
            </span>
            {isCustom && (
              <span className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 rounded-full border border-primary/20 leading-4">
                {t("settings.customRole")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isSelected ? "bg-primary" : "bg-muted-foreground/40"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
              {grantedCount}/{totalCount}
            </span>
          </div>
        </div>
        {isCustom && isAdmin && onDelete && (
          <button
            type="button"
            className="h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title={t("settings.deleteRole")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export function RolePermissionsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [selectedRole,  setSelectedRole]  = useState<string>("manager");
  const [localPerms,    setLocalPerms]    = useState<Record<string, boolean>>({});
  const [dirty,         setDirty]         = useState(false);
  const [addRoleOpen,   setAddRoleOpen]   = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<CustomRoleItem | null>(null);

  const { data, isLoading } = useGetRolePermissions({
    query: { queryKey: getGetRolePermissionsQueryKey() },
  });

  const { data: allUserRoles = [], isLoading: customRolesLoading } = useListCustomRoles({
    query: { queryKey: getListCustomRolesQueryKey(), enabled: isAdmin },
  });

  const builtInRolesDb  = allUserRoles.filter((r) => r.isBuiltin);
  const customRoles      = allUserRoles.filter((r) => !r.isBuiltin);
  const hasDbBuiltins    = builtInRolesDb.length > 0;

  useEffect(() => {
    if (data?.matrix && selectedRole) {
      const rolePerms = data.matrix[selectedRole] ?? {};
      const init: Record<string, boolean> = {};
      ALL_PERMISSIONS.forEach((p) => { init[p] = rolePerms[p] ?? false; });
      setLocalPerms(init);
      setDirty(false);
    }
  }, [data, selectedRole]);

  const { mutate: savePerm, isPending: saving } = useUpdateRolePermissions({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetRolePermissionsQueryKey() });
        toast({ title: t("settings.permSaved") });
        setDirty(false);
      },
      onError: () => toast({ title: t("settings.permSaveFailed"), variant: "destructive" }),
    },
  });

  const { mutate: resetPerm, isPending: resetting } = useResetRolePermissions({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetRolePermissionsQueryKey() });
        toast({ title: t("settings.permResetDone") });
        setDirty(false);
      },
      onError: () => toast({ title: t("settings.permResetFailed"), variant: "destructive" }),
    },
  });

  const { mutate: createRoleMutate, isPending: creating } = useCreateCustomRole({
    mutation: {
      onSuccess: (created) => {
        qc.invalidateQueries({ queryKey: getListCustomRolesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetRolePermissionsQueryKey() });
        setSelectedRole(created.id);
        setDirty(false);
        toast({ title: t("settings.roleCreated") });
      },
      onError: () => toast({ title: t("settings.roleCreatedFailed"), variant: "destructive" }),
    },
  });

  const { mutate: deleteRoleMutate, isPending: deleting } = useDeleteCustomRole({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCustomRolesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetRolePermissionsQueryKey() });
        if (customRoles.some((r) => r.id === deleteTarget?.id) && selectedRole === deleteTarget?.id) {
          setSelectedRole("manager");
        }
        toast({ title: t("settings.roleDeleted") });
        setDeleteTarget(null);
      },
      onError: () => toast({ title: t("settings.roleDeletedFailed"), variant: "destructive" }),
    },
  });

  function handleToggle(perm: string) {
    if (!isAdmin) return;
    setLocalPerms((prev) => ({ ...prev, [perm]: !prev[perm] }));
    setDirty(true);
  }

  function handleToggleGroup(group: string, value: boolean) {
    if (!isAdmin) return;
    const perms = PERMISSION_GROUPS[group]?.perms ?? [];
    setLocalPerms((prev) => {
      const next = { ...prev };
      perms.forEach((p) => { next[p] = value; });
      return next;
    });
    setDirty(true);
  }

  function handleSave() {
    savePerm({ role: selectedRole, data: localPerms });
  }

  function handleReset() {
    const isCustom = customRoles.some((r) => r.id === selectedRole);
    if (isCustom) {
      const allFalse: Record<string, boolean> = {};
      ALL_PERMISSIONS.forEach((p) => { allFalse[p] = false; });
      setLocalPerms(allFalse);
      setDirty(true);
      return;
    }
    resetPerm({ role: selectedRole });
  }

  function handleCreateRole(d: { id: string; label: string; baseRole: string; dotIdx: number; initPerms: Record<string, boolean> }) {
    createRoleMutate({ data: { id: d.id, label: d.label, baseRole: d.baseRole, dotIdx: d.dotIdx, initPerms: d.initPerms } });
    setLocalPerms(d.initPerms);
  }

  function handleDeleteRole(role: CustomRoleItem) {
    deleteRoleMutate({ id: role.id });
  }

  /* Computed stats */
  const grantedCount  = useMemo(() => Object.values(localPerms).filter(Boolean).length, [localPerms]);
  const totalCount    = ALL_PERMISSIONS.length;

  function getRoleStats(roleId: string) {
    const perms = data?.matrix?.[roleId] ?? {};
    const granted = ALL_PERMISSIONS.filter((p) => perms[p]).length;
    return { granted, total: ALL_PERMISSIONS.length };
  }

  function getRoleDot(roleId: string) {
    const custom = customRoles.find((r) => r.id === roleId);
    if (custom) return CUSTOM_DOT_PALETTE[custom.dotIdx % CUSTOM_DOT_PALETTE.length];
    return ROLE_DOT[roleId] ?? "bg-slate-400";
  }

  function getRoleLabel(roleId: string) {
    const custom = customRoles.find((r) => r.id === roleId);
    if (custom) return custom.label;
    return t(`settings.roleCategory_${roleId}`, roleId);
  }

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-[18px] w-[18px] text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">{t("settings.roleSettings")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("settings.roleSettingsDesc")}</p>
        </div>
        {!isLoading && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {t("settings.roleCount", { count: allUserRoles.length > 0 ? allUserRoles.length : BUILT_IN_ROLES.length })}
          </Badge>
        )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel: role list ── */}
        <div className="lg:w-56 xl:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
              {t("settings.builtInRoles")}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 rounded-xl" />
                ))
              : (hasDbBuiltins ? builtInRolesDb : BUILT_IN_ROLES.map((id) => ({ id, label: t(`settings.roleCategory_${id}`, id), isBuiltin: true, dotIdx: 0 }))).map((role) => {
                  const roleId = role.id;
                  const { granted } = getRoleStats(roleId);
                  const liveCount  = selectedRole === roleId ? grantedCount : granted;
                  return (
                    <RoleListItem
                      key={roleId}
                      roleId={roleId}
                      label={t(`settings.roleCategory_${roleId}`, role.label)}
                      dot={getRoleDot(roleId)}
                      badgeClass={ROLE_BADGE[roleId]}
                      grantedCount={liveCount}
                      totalCount={totalCount}
                      isSelected={selectedRole === roleId}
                      isCustom={false}
                      isAdmin={isAdmin}
                      onClick={() => { if (selectedRole !== roleId) { setSelectedRole(roleId); setDirty(false); } }}
                    />
                  );
                })}

            {/* Custom roles section */}
            {customRoles.length > 0 && (
              <>
                <div className="px-1 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("settings.customRoles")}
                  </p>
                </div>
                {customRoles.map((cr: CustomRoleItem) => {
                  const { granted } = getRoleStats(cr.id);
                  const liveCount  = selectedRole === cr.id ? grantedCount : granted;
                  return (
                    <RoleListItem
                      key={cr.id}
                      roleId={cr.id}
                      label={cr.label}
                      dot={CUSTOM_DOT_PALETTE[cr.dotIdx % CUSTOM_DOT_PALETTE.length]}
                      grantedCount={liveCount}
                      totalCount={totalCount}
                      isSelected={selectedRole === cr.id}
                      isCustom={true}
                      isAdmin={isAdmin}
                      onClick={() => { if (selectedRole !== cr.id) { setSelectedRole(cr.id); setDirty(false); } }}
                      onDelete={() => setDeleteTarget(cr)}
                    />
                  );
                })}
              </>
            )}
          </div>

          {/* Add role button */}
          {isAdmin && (
            <div className="p-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl h-9 gap-2 text-xs border-dashed border-primary/40 text-primary hover:text-primary hover:bg-primary/8 hover:border-primary/60"
                onClick={() => setAddRoleOpen(true)}
                disabled={creating || customRolesLoading}
              >
                <Plus className="h-3.5 w-3.5" />
                {creating ? t("settings.saving") : t("settings.addRoleBtn")}
              </Button>
            </div>
          )}
        </div>

        {/* ── Right panel: permissions ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Selected role header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className={`h-3 w-3 rounded-full shrink-0 ${getRoleDot(selectedRole)}`} />
              <span className="text-sm font-semibold text-foreground">{getRoleLabel(selectedRole)}</span>
              {customRoles.some((r: CustomRoleItem) => r.id === selectedRole) && (
                <span className="text-[9px] font-semibold bg-primary/10 text-primary px-1.5 rounded-full border border-primary/20 leading-4">
                  {t("settings.customRole")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <Badge className="text-[10px] bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25 h-5 px-2">
                  ● {t("settings.unsaved")}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px] h-5 px-2 tabular-nums">
                {grantedCount}/{totalCount} {t("settings.active")}
              </Badge>
            </div>
          </div>

          {/* Permission groups */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
              : Object.entries(PERMISSION_GROUPS).map(([group, { perms, Icon }], idx) => (
                  <PermGroupCard
                    key={group}
                    group={group}
                    perms={perms}
                    Icon={Icon}
                    localPerms={localPerms}
                    isAdmin={isAdmin}
                    saving={saving}
                    resetting={resetting}
                    onToggle={handleToggle}
                    onToggleGroup={handleToggleGroup}
                    defaultOpen={idx === 0}
                  />
                ))}
          </div>

          {/* Action bar */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40 bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-2 text-xs"
                onClick={handleReset}
                disabled={resetting || saving}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetting ? t("settings.saving") : t("settings.permResetBtn")}
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 rounded-xl gap-2 text-xs"
                onClick={handleSave}
                disabled={!dirty || saving}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? t("settings.saving") : t("settings.permSaveBtn")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddRoleDialog
        open={addRoleOpen}
        onClose={() => setAddRoleOpen(false)}
        onCreated={handleCreateRole}
        existingCount={customRoles.length}
        matrix={data?.matrix ?? {}}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deleteRole")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{deleteTarget?.label}</span> — {t("settings.deleteRoleDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteRole(deleteTarget)}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? t("settings.saving") : t("settings.deleteRole")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
