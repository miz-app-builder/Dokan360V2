import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, CheckCheck, Square, ChevronDown } from "lucide-react";
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  BUILT_IN_ROLES,
  CUSTOM_DOT_PALETTE,
  makeRoleId,
} from "./rolePermissionsConstants";

interface AddRoleDialogProps {
  open:          boolean;
  onClose:       () => void;
  onCreated:     (data: { id: string; label: string; baseRole: string; dotIdx: number; initPerms: Record<string, boolean> }) => void;
  existingCount: number;
  matrix:        Record<string, Record<string, boolean>>;
}

export function AddRoleDialog({
  open, onClose, onCreated, existingCount, matrix,
}: AddRoleDialogProps) {
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

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
              {Object.entries(PERMISSION_GROUPS).map(([group, { perms, Icon }]) => {
                const granted = perms.filter((p) => localPerms[p]).length;
                const allOn   = granted === perms.length;
                const isOpen  = openGroups.has(group);
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
