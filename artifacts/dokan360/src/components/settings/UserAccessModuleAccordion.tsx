import { useTranslation } from "react-i18next";
import { CheckCheck, Square, ChevronDown, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MODULE_KEYS,
  MODULE_ICONS,
  MODULE_COLORS,
  MODULE_SUB_PERMS,
  getModuleState,
  isSubPermEnabled,
  getEnabledSubCount,
  type ModuleKey,
} from "./userAccessConstants";

interface UserAccessModuleAccordionProps {
  localModules:     Set<string>;
  isAdmin:          boolean;
  saving:           boolean;
  resetting:        boolean;
  loading:          boolean;
  openMods:         Set<string>;
  enabledCount:     number;
  onToggleMod:      (mod: string) => void;
  onToggleModule:   (mod: ModuleKey) => void;
  onToggleSubPerm:  (mod: ModuleKey, perm: string) => void;
  onSelectAll:      () => void;
  onDeselectAll:    () => void;
}

export function UserAccessModuleAccordion({
  localModules,
  isAdmin,
  saving,
  resetting,
  loading,
  openMods,
  enabledCount,
  onToggleMod,
  onToggleModule,
  onToggleSubPerm,
  onSelectAll,
  onDeselectAll,
}: UserAccessModuleAccordionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("settings.permissionsSection")} ({enabledCount}/{MODULE_KEYS.length})
        </p>
        {isAdmin && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSelectAll}
              disabled={saving || resetting}
              className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/8 flex items-center gap-1 disabled:opacity-40"
            >
              <CheckCheck className="h-3 w-3" />
              {t("settings.userAccessSelectAll")}
            </button>
            <span className="text-muted-foreground/30 text-xs">|</span>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={saving || resetting}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60 flex items-center gap-1 disabled:opacity-40"
            >
              <Square className="h-3 w-3" />
              {t("settings.userAccessDeselectAll")}
            </button>
          </div>
        )}
      </div>

      {/* Module accordion list */}
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))
        : MODULE_KEYS.map((mod) => {
            const Icon     = MODULE_ICONS[mod];
            const colorCls = MODULE_COLORS[mod];
            const state    = getModuleState(mod, localModules);
            const subPerms = MODULE_SUB_PERMS[mod];
            const isOpen   = openMods.has(mod);

            return (
              <div key={mod} className="rounded-xl border border-border/50 overflow-hidden">
                {/* Module row */}
                <div
                  className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => subPerms && onToggleMod(mod)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${colorCls}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80">
                      {t(`settings.module_${mod}`, mod)}
                    </span>
                    {state === "partial" && (
                      <span className="text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/20 leading-none">
                        {t("settings.partialAccess")} {getEnabledSubCount(mod, localModules)}/{subPerms?.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {subPerms && isOpen && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {getEnabledSubCount(mod, localModules)}/{subPerms.length}
                      </span>
                    )}
                    <Switch
                      checked={state !== "disabled"}
                      onCheckedChange={() => onToggleModule(mod)}
                      disabled={!isAdmin || saving || resetting}
                    />
                    {subPerms && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </div>

                {/* Sub-permissions */}
                {subPerms && isOpen && (
                  <div className="divide-y divide-border/30 border-t border-border/40">
                    {subPerms.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center justify-between px-4 py-2 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {!isAdmin && <Lock className="h-3 w-3 text-muted-foreground/60 shrink-0" />}
                          <span className="text-xs text-foreground/70">
                            {t(`settings.subPerm_${perm}`, perm)}
                          </span>
                        </div>
                        <Switch
                          checked={isSubPermEnabled(perm, mod, localModules)}
                          onCheckedChange={() => onToggleSubPerm(mod, perm)}
                          disabled={!isAdmin || saving || resetting}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
    </div>
  );
}
