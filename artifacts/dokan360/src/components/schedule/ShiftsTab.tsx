import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  getListShiftsQueryKey,
  type Shift,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Clock, Edit2, Trash2, Sun, Moon, Sunset } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

function ShiftIcon({ startTime }: { startTime: string }) {
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour >= 5 && hour < 12)  return <Sun className="h-4 w-4" />;
  if (hour >= 12 && hour < 18) return <Sunset className="h-4 w-4" />;
  return <Moon className="h-4 w-4" />;
}

type ShiftFormData = {
  name:      string;
  nameBn:    string;
  startTime: string;
  endTime:   string;
  color:     string;
  isActive:  boolean;
};

const DEFAULT_FORM: ShiftFormData = {
  name: "", nameBn: "", startTime: "09:00", endTime: "17:00", color: "#6366f1", isActive: true,
};

export function ShiftsTab() {
  const { t }         = useTranslation();
  const { toast }     = useToast();
  const queryClient   = useQueryClient();

  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [editTarget,  setEditTarget]  = useState<Shift | null>(null);
  const [form,        setForm]        = useState<ShiftFormData>(DEFAULT_FORM);

  const { data: shifts = [], isLoading } = useListShifts();
  const createMut = useCreateShift();
  const updateMut = useUpdateShift();
  const deleteMut = useDeleteShift();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListShiftsQueryKey() });

  function openCreate() {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  }

  function openEdit(shift: Shift) {
    setEditTarget(shift);
    setForm({
      name:      shift.name,
      nameBn:    shift.nameBn,
      startTime: shift.startTime,
      endTime:   shift.endTime,
      color:     shift.color,
      isActive:  shift.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.nameBn || !form.startTime || !form.endTime) return;

    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, data: form });
        toast({ title: t("schedule.shiftSaved") });
      } else {
        await createMut.mutateAsync({ data: { name: form.name, nameBn: form.nameBn, startTime: form.startTime, endTime: form.endTime, color: form.color } });
        toast({ title: t("schedule.shiftSaved") });
      }
      invalidate();
      setDialogOpen(false);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync({ id: deleteId });
      toast({ title: t("schedule.shiftDeleted") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{t("schedule.shiftsDesc")}</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t("schedule.addShift")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Clock className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">{t("schedule.noShifts")}</p>
            <p className="text-xs text-muted-foreground">{t("schedule.noShiftsDesc")}</p>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t("schedule.addShift")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shifts.map((shift) => (
            <Card key={shift.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: shift.color }} />
              <CardContent className="pl-5 pr-4 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: shift.color + "20", color: shift.color }}>
                      <ShiftIcon startTime={shift.startTime} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{shift.nameBn}</p>
                      <p className="text-xs text-muted-foreground">{shift.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(shift)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(shift.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{shift.startTime} — {shift.endTime}</span>
                  </div>
                  <Badge variant={shift.isActive ? "default" : "secondary"} className="text-xs px-1.5 py-0">
                    {shift.isActive ? t("schedule.active") : t("schedule.inactive")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? t("schedule.editShift") : t("schedule.addShift")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("schedule.shiftNameBn")} *</Label>
                <Input
                  value={form.nameBn}
                  onChange={(e) => setForm((f) => ({ ...f, nameBn: e.target.value }))}
                  placeholder="সকাল শিফট"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("schedule.shiftName")} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Morning Shift"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("schedule.startTime")} *</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("schedule.endTime")} *</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("schedule.color")}</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      form.color === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-7 w-7 rounded-full border-0 cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {editTarget && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
                <Label className="text-sm">{t("schedule.active")}</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name || !form.nameBn}>
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("schedule.deleteShift")}</AlertDialogTitle>
            <AlertDialogDescription>{t("schedule.shiftDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
