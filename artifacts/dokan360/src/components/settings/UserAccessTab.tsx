import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserCog,
  Save,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  CheckCheck,
  Square,
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
  Lock,
  DatabaseZap,
  ChevronDown,
} from "lucide-react";

/* ─── Constants ──────────────────────────────────────────────── */
const MODULE_KEYS = [
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

type ModuleKey = (typeof MODULE_KEYS)[number];

const MODULE_ICONS: Record<ModuleKey, React.ElementType> = {
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

const MODULE_COLORS: Record<ModuleKey, string> = {
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

/* Sub-permissions per module (modules not listed have no sub-perms) */
const MODULE_SUB_PERMS: Partial<Record<ModuleKey, string[]>> = {
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

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin:  "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  seller: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  viewer: "bg-slate-500/10 text-slate-700 dark:text-slate-400",
};

interface UserAccessItem {
  userId:          number;
  name:            string;
  email:           string;
  role:            string;
  isActive:        boolean;
  allowedModules:  string[];
  dataRestriction: string;
  hasOverride:     boolean;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function getModuleState(mod: ModuleKey, modules: Set<string>): "enabled" | "partial" | "disabled" {
  if (modules.has(mod)) return "enabled";
  const subPerms = MODULE_SUB_PERMS[mod];
  if (!subPerms) return "disabled";
  const count = subPerms.filter((p) => modules.has(p)).length;
  if (count === 0) return "disabled";
  if (count === subPerms.length) return "enabled";
  return "partial";
}

function isSubPermEnabled(perm: string, mod: ModuleKey, modules: Set<string>): boolean {
  if (modules.has(mod)) return true;
  return modules.has(perm);
}

function getEnabledSubCount(mod: ModuleKey, modules: Set<string>): number {
  const subPerms = MODULE_SUB_PERMS[mod];
  if (!subPerms) return 0;
  if (modules.has(mod)) return subPerms.length;
  return subPerms.filter((p) => modules.has(p)).length;
}

function buildSelectAllModules(): Set<string> {
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

/* ─── Main component ─────────────────────────────────────────── */
export function UserAccessTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [users, setUsers] = useState<UserAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [localModules, setLocalModules] = useState<Set<string>>(buildSelectAllModules);
  const [localRestriction, setLocalRestriction] = useState<string>("none");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());

  async function fetchUsers() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user-access", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json() as { data: UserAccessItem[] };
        setUsers(json.data);
        if (json.data.length > 0 && selectedUserId === null) {
          const first = json.data[0];
          if (first) {
            setSelectedUserId(first.userId);
            setLocalModules(new Set(first.allowedModules));
            setLocalRestriction(first.dataRestriction);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, [token]);

  useEffect(() => {
    if (selectedUserId === null) return;
    const found = users.find((u) => u.userId === selectedUserId);
    if (found) {
      setLocalModules(new Set(found.allowedModules));
      setLocalRestriction(found.dataRestriction);
      setDirty(false);
    }
  }, [selectedUserId]);

  function handleSelectUser(userId: number) {
    if (userId === selectedUserId) return;
    setSelectedUserId(userId);
  }

  function toggleMod(mod: string) {
    setOpenMods((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod); else next.add(mod);
      return next;
    });
  }

  function handleToggleModule(mod: ModuleKey) {
    if (!isAdmin) return;
    setLocalModules((prev) => {
      const next = new Set(prev);
      const subPerms = MODULE_SUB_PERMS[mod];
      const state = getModuleState(mod, prev);
      if (state !== "disabled") {
        next.delete(mod);
        subPerms?.forEach((p) => next.delete(p));
      } else {
        if (!subPerms) {
          next.add(mod);
        } else {
          next.delete(mod);
          subPerms.forEach((p) => next.add(p));
        }
      }
      return next;
    });
    setDirty(true);
  }

  function handleToggleSubPerm(mod: ModuleKey, perm: string) {
    if (!isAdmin) return;
    setLocalModules((prev) => {
      const next = new Set(prev);
      const subPerms = MODULE_SUB_PERMS[mod] ?? [];
      if (next.has(mod)) {
        next.delete(mod);
        subPerms.forEach((p) => next.add(p));
      }
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
    setDirty(true);
  }

  function handleSelectAll() {
    if (!isAdmin) return;
    setLocalModules(buildSelectAllModules());
    setDirty(true);
  }

  function handleDeselectAll() {
    if (!isAdmin) return;
    setLocalModules(new Set());
    setDirty(true);
  }

  async function handleSave() {
    if (!token || selectedUserId === null) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/user-access/${selectedUserId}`, {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ allowedModules: Array.from(localModules), dataRestriction: localRestriction }),
      });
      if (res.ok) {
        toast({ title: t("settings.userAccessSaved") });
        setDirty(false);
        await fetchUsers();
      } else {
        toast({ title: t("settings.userAccessSaveFailed"), variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!token || selectedUserId === null) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/user-access/${selectedUserId}/reset`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: t("settings.userAccessResetDone") });
        setResetConfirmOpen(false);
        await fetchUsers();
        setLocalModules(buildSelectAllModules());
        setLocalRestriction("none");
        setDirty(false);
      } else {
        toast({ title: t("settings.userAccessResetFailed"), variant: "destructive" });
      }
    } finally {
      setResetting(false);
    }
  }

  const selectedUser = useMemo(
    () => users.find((u) => u.userId === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const enabledCount = MODULE_KEYS.filter(
    (mod) => getModuleState(mod, localModules) !== "disabled",
  ).length;

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
          <UserCog className="h-[18px] w-[18px] text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {t("settings.userAccessTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("settings.userAccessDesc")}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {users.length} {t("settings.userAccessRoleLabel")}
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel: user list ── */}
        <div className="lg:w-56 xl:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col overflow-y-auto">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-2">
              {t("settings.userManagement")}
            </p>
          </div>

          <div className="flex-1 px-2 pb-2 space-y-0.5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))
              : users.length === 0
              ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t("settings.userAccessNoUsers")}
                </div>
              )
              : users.map((u) => {
                  const isSelected = selectedUserId === u.userId;
                  const initials   = u.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => handleSelectUser(u.userId)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 transition-all ${
                        isSelected
                          ? "bg-primary/10 border border-primary/30 shadow-sm"
                          : "hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className={`text-[10px] font-bold ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate leading-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                            {u.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BADGE_COLORS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                              {u.role}
                            </span>
                            {u.hasOverride && (
                              <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 rounded-full border border-amber-500/20 leading-4">
                                ●
                              </span>
                            )}
                          </div>
                        </div>
                        {!u.isActive && (
                          <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* ── Right panel: module access ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Selected user header */}
          {selectedUser && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-[10px] font-bold bg-primary text-primary-foreground">
                    {selectedUser.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-semibold text-foreground">{selectedUser.name}</span>
                  <p className="text-[11px] text-muted-foreground">{selectedUser.email}</p>
                </div>
                {selectedUser.hasOverride ? (
                  <Badge className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 h-5 px-2 gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    {t("settings.userAccessHasOverride")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] h-5 px-2 gap-1">
                    <ShieldOff className="h-2.5 w-2.5" />
                    {t("settings.userAccessNoOverride")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {dirty && (
                  <Badge className="text-[10px] bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25 h-5 px-2">
                    ● {t("settings.unsaved")}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] h-5 px-2 tabular-nums">
                  {enabledCount}/{MODULE_KEYS.length} {t("settings.active")}
                </Badge>
              </div>
            </div>
          )}

          {/* Module accordion */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("settings.userAccessModules")}
                </p>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] font-medium text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/8 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" />
                      {t("settings.userAccessSelectAll")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-[10px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/60 flex items-center gap-1 transition-colors"
                    >
                      <Square className="h-3 w-3" />
                      {t("settings.userAccessDeselectAll")}
                    </button>
                  </div>
                )}
              </div>

              {/* Module accordion list */}
              <div className="space-y-1.5">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 rounded-xl" />
                    ))
                  : MODULE_KEYS.map((mod) => {
                      const Icon     = MODULE_ICONS[mod];
                      const colors   = MODULE_COLORS[mod];
                      const subPerms = MODULE_SUB_PERMS[mod];
                      const state    = getModuleState(mod, localModules);
                      const enabled  = state !== "disabled";
                      const partial  = state === "partial";
                      const isOpen   = openMods.has(mod);
                      const subCount = subPerms ? getEnabledSubCount(mod, localModules) : 0;

                      return (
                        <div
                          key={mod}
                          className={`rounded-xl border overflow-hidden transition-all ${
                            enabled
                              ? "border-border/60 bg-card"
                              : "border-border/30 bg-muted/20"
                          }`}
                        >
                          {/* Module header row */}
                          <div className="flex items-center gap-0 px-3.5 py-2.5">
                            <button
                              type="button"
                              className={`flex items-center gap-2.5 flex-1 text-left min-w-0 ${subPerms ? "cursor-pointer" : "cursor-default"}`}
                              onClick={() => subPerms && toggleMod(mod)}
                            >
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${colors} ${!enabled ? "opacity-50" : ""}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-sm font-medium truncate ${!enabled ? "text-muted-foreground" : "text-foreground"}`}>
                                  {t(`settings.module_${mod}`, mod)}
                                </span>
                                {partial && (
                                  <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full leading-none shrink-0">
                                    {t("settings.partialAccess")}
                                  </span>
                                )}
                                {subPerms && enabled && (
                                  <span className="text-[9px] text-muted-foreground shrink-0">
                                    ({subCount}/{subPerms.length})
                                  </span>
                                )}
                              </div>
                              {subPerms && (
                                <ChevronDown
                                  className={`h-3.5 w-3.5 text-muted-foreground/50 ml-1 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                />
                              )}
                            </button>
                            <Switch
                              checked={enabled}
                              onCheckedChange={() => handleToggleModule(mod)}
                              disabled={!isAdmin || saving || resetting}
                              className="ml-3 shrink-0"
                            />
                          </div>

                          {/* Sub-permissions (expanded) */}
                          {isOpen && subPerms && (
                            <div className="border-t border-border/40 divide-y divide-border/30 bg-muted/20">
                              {subPerms.map((perm) => {
                                const subEnabled = isSubPermEnabled(perm, mod, localModules);
                                return (
                                  <div
                                    key={perm}
                                    className={`flex items-center justify-between px-4 py-2 transition-colors hover:bg-muted/40 ${!enabled ? "opacity-50" : ""}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {!enabled
                                        ? <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                        : <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${subEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
                                      }
                                      <span className="text-sm text-foreground/80">
                                        {t(`settings.perm_${perm}`, perm)}
                                      </span>
                                    </div>
                                    <Switch
                                      checked={subEnabled}
                                      onCheckedChange={() => handleToggleSubPerm(mod, perm)}
                                      disabled={!isAdmin || saving || resetting || !enabled}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* Data Restriction section */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <DatabaseZap className="h-3.5 w-3.5" />
                {t("settings.userAccessDataRestriction")}
              </p>
              <div className="rounded-xl border border-border/60 p-3.5 bg-card space-y-2">
                {(["none", "own_sales", "own_outlet"] as const).map((val) => {
                  const labels: Record<string, string> = {
                    none:        t("settings.userAccessRestrictionNone"),
                    own_sales:   t("settings.userAccessRestrictionOwnSales"),
                    own_outlet:  t("settings.userAccessRestrictionOwnOutlet"),
                  };
                  const isSelected = localRestriction === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={!isAdmin || saving}
                      onClick={() => { setLocalRestriction(val); setDirty(true); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-primary/10 border border-primary/30 text-primary"
                          : "border border-border/40 hover:bg-muted/40 text-foreground"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className={`h-3 w-3 rounded-full border-2 shrink-0 transition-all ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                      }`} />
                      <span className="text-sm font-medium">{labels[val]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action bar */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/40 bg-muted/10">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-2 text-xs"
                onClick={() => setResetConfirmOpen(true)}
                disabled={resetting || saving || !selectedUser?.hasOverride}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetting ? t("settings.saving") : t("settings.userAccessResetBtn")}
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 rounded-xl gap-2 text-xs"
                onClick={handleSave}
                disabled={!dirty || saving || selectedUserId === null}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? t("settings.saving") : t("settings.userAccessSaveBtn")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reset confirm dialog */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={(v) => !v && setResetConfirmOpen(false)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.userAccessResetBtn")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{selectedUser?.name}</span>{" "}
              — {t("settings.userAccessNoOverride")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {t("settings.userAccessResetBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
