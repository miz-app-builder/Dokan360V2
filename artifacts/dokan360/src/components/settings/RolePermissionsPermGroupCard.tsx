import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { CheckCheck, Square, ChevronDown, Lock } from "lucide-react";

interface PermGroupCardProps {
  group:         string;
  perms:         string[];
  Icon:          React.ElementType;
  localPerms:    Record<string, boolean>;
  isAdmin:       boolean;
  saving:        boolean;
  resetting:     boolean;
  defaultOpen?:  boolean;
  onToggle:      (perm: string) => void;
  onToggleGroup: (group: string, value: boolean) => void;
}

export function PermGroupCard({
  group, perms, Icon, localPerms, isAdmin, saving, resetting,
  defaultOpen = false, onToggle, onToggleGroup,
}: PermGroupCardProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const granted = perms.filter((p) => localPerms[p]).length;
  const allOn   = granted === perms.length;

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
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
