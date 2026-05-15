import { useTranslation } from "react-i18next";
import type { LeaveType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6",
];

export type LeaveTypeFormData = {
  name: string; nameBn: string; defaultDays: number;
  isPaid: boolean; color: string; isActive: boolean;
};

export const EMPTY_FORM: LeaveTypeFormData = {
  name: "", nameBn: "", defaultDays: 14, isPaid: true, color: "#10b981", isActive: true,
};

type Props = {
  open:        boolean;
  onOpenChange: (v: boolean) => void;
  editTarget:  LeaveType | null;
  form:        LeaveTypeFormData;
  onChange:    (patch: Partial<LeaveTypeFormData>) => void;
  onSave:      () => void;
  isSaving:    boolean;
};

export function LeaveTypeFormDialog({ open, onOpenChange, editTarget, form, onChange, onSave, isSaving }: Props) {
  const { t } = useTranslation();

  const isDefault = editTarget?.isDefault ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editTarget
              ? isDefault ? t("leaves.customizeDefaultType") : t("leaves.editType")
              : t("leaves.addType")}
          </DialogTitle>
          {isDefault && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("leaves.customizeDefaultHint")}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("leaves.typeNameBn")} *</Label>
              <Input
                value={form.nameBn}
                onChange={(e) => onChange({ nameBn: e.target.value })}
                placeholder={t("leaves.typeNameBnPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("leaves.typeName")} *</Label>
              <Input
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Sick Leave"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("leaves.defaultDays")}</Label>
            <Input
              type="number" min={0} max={365}
              value={form.defaultDays}
              onChange={(e) => onChange({ defaultDays: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("schedule.color")}</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c} type="button"
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-all",
                    form.color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => onChange({ color: c })}
                />
              ))}
              <input
                type="color" value={form.color}
                onChange={(e) => onChange({ color: e.target.value })}
                className="h-7 w-7 rounded-full border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isPaid} onCheckedChange={(v) => onChange({ isPaid: v })} />
              <Label className="text-sm">{t("leaves.paid")}</Label>
            </div>
            {editTarget && (
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => onChange({ isActive: v })} />
                <Label className="text-sm">{t("schedule.active")}</Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={isSaving || !form.name || !form.nameBn}>
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
