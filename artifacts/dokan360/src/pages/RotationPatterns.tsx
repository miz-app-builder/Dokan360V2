import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  RefreshCw, Plus, Pencil, Trash2, Check, ChevronDown, Star, X,
} from "lucide-react";
import { customFetch, useListShifts } from "@workspace/api-client-react";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { useToast } from "@/hooks/use-toast";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

type CycleType = "daily" | "weekly" | "monthly";

type RotationPattern = {
  id:          number;
  shopId:      number;
  name:        string;
  nameBn:      string;
  cycleType:   CycleType;
  cycleLength: number;
  startDate:   string;
  isDefault:   boolean;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
};

type RotationPatternSlot = {
  id:             number;
  patternId:      number;
  slotIndex:      number;
  weekday:        number | null;
  shiftId:        number | null;
  shiftName:      string | null;
  shiftNameBn:    string | null;
  shiftColor:     string | null;
  shiftStartTime: string | null;
  shiftEndTime:   string | null;
  createdAt:      string;
  updatedAt:      string;
};

type RotationPatternWithSlots = RotationPattern & { slots: RotationPatternSlot[] };

type SlotInput = { slotIndex: number; weekday: number | null; shiftId: number | null };

// ─── API helpers ──────────────────────────────────────────────────────────────

function fetchPatterns()  { return customFetch<RotationPattern[]>("/api/rotation-patterns"); }
function fetchPattern(id: number) { return customFetch<RotationPatternWithSlots>(`/api/rotation-patterns/${id}`); }

async function apiCreatePattern(data: Omit<RotationPattern, "id" | "shopId" | "createdAt" | "updatedAt">) {
  return customFetch<RotationPattern>("/api/rotation-patterns", { method: "POST", body: JSON.stringify(data) });
}
async function apiUpdatePattern(id: number, data: Partial<RotationPattern>) {
  return customFetch<RotationPattern>(`/api/rotation-patterns/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}
async function apiDeletePattern(id: number) {
  return customFetch<{ ok: boolean }>(`/api/rotation-patterns/${id}`, { method: "DELETE" });
}
async function apiSetSlots(patternId: number, slots: SlotInput[]) {
  return customFetch<RotationPatternSlot[]>(`/api/rotation-patterns/${patternId}/slots`, {
    method: "PUT",
    body: JSON.stringify({ slots }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CYCLE_TYPES: CycleType[] = ["daily", "weekly", "monthly"];
const CYCLE_LENGTHS = [1, 2, 3, 4, 6, 8, 12];
const today = new Date().toISOString().split("T")[0]!;

// ─── Pattern Form Dialog ──────────────────────────────────────────────────────

type PatternFormState = {
  name:        string;
  nameBn:      string;
  cycleType:   CycleType;
  cycleLength: number;
  startDate:   string;
  isDefault:   boolean;
};

const EMPTY_FORM: PatternFormState = {
  name:        "",
  nameBn:      "",
  cycleType:   "weekly",
  cycleLength: 2,
  startDate:   today,
  isDefault:   false,
};

function PatternFormDialog({
  open, onClose, pattern,
}: {
  open: boolean; onClose: () => void; pattern?: RotationPattern | null;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isNew = !pattern;

  const [form, setForm] = useState<PatternFormState>(
    pattern ? {
      name:        pattern.name,
      nameBn:      pattern.nameBn,
      cycleType:   pattern.cycleType,
      cycleLength: pattern.cycleLength,
      startDate:   pattern.startDate,
      isDefault:   pattern.isDefault,
    } : EMPTY_FORM,
  );

  const set = <K extends keyof PatternFormState>(k: K) => (v: PatternFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => isNew
      ? apiCreatePattern({ ...form, isActive: true })
      : apiUpdatePattern(pattern!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation-patterns"] });
      toast({ title: t("schedule.rotation.saved") });
      onClose();
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  const valid = form.name.trim() !== "" && form.nameBn.trim() !== "" && form.startDate !== "";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {t(isNew ? "schedule.rotation.addPattern" : "schedule.rotation.editPattern")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("schedule.rotation.patternName")}</Label>
              <Input className="h-9 rounded-xl text-sm" value={form.name}
                onChange={(e) => set("name")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("schedule.rotation.patternNameBn")}</Label>
              <Input className="h-9 rounded-xl text-sm" value={form.nameBn}
                onChange={(e) => set("nameBn")(e.target.value)} />
            </div>
          </div>

          {/* Cycle Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("schedule.rotation.cycleType")}</Label>
            <Select value={form.cycleType} onValueChange={(v) => set("cycleType")(v as CycleType)}>
              <SelectTrigger className="h-9 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CYCLE_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {t(`schedule.rotation.cycle${ct.charAt(0).toUpperCase()}${ct.slice(1)}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cycle Length */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("schedule.rotation.cycleLength")} — {form.cycleLength}{" "}
              {t(`schedule.rotation.${form.cycleType === "daily" ? "day" : form.cycleType === "weekly" ? "week" : "month"}`)}
            </Label>
            <Select value={String(form.cycleLength)} onValueChange={(v) => set("cycleLength")(Number(v))}>
              <SelectTrigger className="h-9 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CYCLE_LENGTHS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("schedule.rotation.startDate")}</Label>
            <Input type="date" className="h-9 rounded-xl text-sm" value={form.startDate}
              onChange={(e) => set("startDate")(e.target.value)} />
          </div>

          {/* Is Default */}
          <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">{t("schedule.rotation.isDefault")}</p>
            </div>
            <Switch checked={form.isDefault} onCheckedChange={set("isDefault")} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={!valid || isPending} className="rounded-xl" onClick={() => save()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Slot Editor Dialog ────────────────────────────────────────────────────────

function SlotEditorDialog({
  open, onClose, pattern,
}: {
  open: boolean; onClose: () => void; pattern: RotationPattern;
}) {
  const { t, i18n } = useTranslation();
  const { toast }   = useToast();
  const qc          = useQueryClient();
  const isBn        = i18n.language === "bn";

  const { data: shifts = [] } = useListShifts();
  const { data: patternData } = useQuery({
    queryKey: ["rotation-patterns", pattern.id],
    queryFn:  () => fetchPattern(pattern.id),
    enabled:  open,
    staleTime: 0,
  });

  // Build slot map: `slotIndex-weekday` → shiftId
  const [slotMap, setSlotMap] = useState<Map<string, number | null>>(() => new Map());

  // Sync from loaded pattern data
  useMemo(() => {
    if (!patternData) return;
    const m = new Map<string, number | null>();
    for (const s of patternData.slots) {
      const key = `${s.slotIndex}-${s.weekday ?? "D"}`;
      m.set(key, s.shiftId);
    }
    setSlotMap(m);
  }, [patternData]);

  const activeShifts = useMemo(() => shifts.filter((s) => s.isActive), [shifts]);

  // Generate slot indices array
  const slotIndices = Array.from({ length: pattern.cycleLength }, (_, i) => i);
  const weekdays    = [0, 1, 2, 3, 4, 5, 6] as const;

  function getSlotKey(slotIndex: number, weekday: number | "D"): string {
    return `${slotIndex}-${weekday}`;
  }
  function setSlot(slotIndex: number, weekday: number | "D", shiftId: number | null) {
    setSlotMap((prev) => {
      const m = new Map(prev);
      m.set(getSlotKey(slotIndex, weekday), shiftId);
      return m;
    });
  }

  const { mutate: saveSlots, isPending } = useMutation({
    mutationFn: () => {
      const slots: SlotInput[] = [];
      for (const [key, shiftId] of slotMap.entries()) {
        const [si, wd] = key.split("-");
        slots.push({
          slotIndex: Number(si),
          weekday:   wd === "D" ? null : Number(wd),
          shiftId,
        });
      }
      return apiSetSlots(pattern.id, slots.filter((s) => s.shiftId !== null));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation-patterns", pattern.id] });
      toast({ title: t("schedule.rotation.slotsSaved") });
      onClose();
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  const cycleUnitLabel = (idx: number) => {
    if (pattern.cycleType === "daily")   return `${t("schedule.rotation.day")} ${idx + 1}`;
    if (pattern.cycleType === "weekly")  return `${t("schedule.rotation.week")} ${idx + 1}`;
    return `${t("schedule.rotation.month")} ${idx + 1}`;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{t("schedule.rotation.slotEditor")}</DialogTitle>
          <p className="text-xs text-muted-foreground">{isBn ? pattern.nameBn : pattern.name}</p>
        </DialogHeader>

        {pattern.cycleType === "daily" ? (
          /* Daily: single column — per slot, one shift */
          <div className="space-y-2">
            {slotIndices.map((si) => {
              const key     = getSlotKey(si, "D");
              const current = slotMap.get(key) ?? null;
              return (
                <div key={si} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                  <p className="text-xs font-semibold text-muted-foreground w-16 shrink-0">{cycleUnitLabel(si)}</p>
                  <Select
                    value={current !== null ? String(current) : "__off__"}
                    onValueChange={(v) => setSlot(si, "D", v === "__off__" ? null : Number(v))}
                  >
                    <SelectTrigger className="h-8 rounded-lg text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__off__">
                        <span className="text-muted-foreground">{t("schedule.dayOff")}</span>
                      </SelectItem>
                      {activeShifts.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? "#6366f1" }} />
                            <span>{isBn ? s.nameBn : s.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        ) : (
          /* Weekly / Monthly: grid — slot × weekday */
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-semibold text-muted-foreground pb-2 pr-3 w-20"></th>
                  {weekdays.map((wd) => (
                    <th key={wd} className="text-center font-semibold text-muted-foreground pb-2 px-1">
                      {t(`schedule.weekdaysShort.${wd}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slotIndices.map((si) => (
                  <tr key={si} className="border-t border-border/40">
                    <td className="py-2 pr-3 font-semibold text-muted-foreground">{cycleUnitLabel(si)}</td>
                    {weekdays.map((wd) => {
                      const key     = getSlotKey(si, wd);
                      const current = slotMap.get(key) ?? null;
                      const shift   = current ? activeShifts.find((s) => s.id === current) : null;
                      return (
                        <td key={wd} className="py-2 px-1">
                          <Select
                            value={current !== null ? String(current) : "__off__"}
                            onValueChange={(v) => setSlot(si, wd, v === "__off__" ? null : Number(v))}
                          >
                            <SelectTrigger className="h-14 rounded-xl border-border/60 p-1 [&>svg]:hidden w-full min-w-[60px]">
                              {shift ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: shift.color ?? "#6366f1" }} />
                                  <p className="text-[9px] font-semibold text-center leading-tight break-words" style={{ color: shift.color ?? undefined }}>
                                    {isBn ? shift.nameBn : shift.name}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground text-center w-full">—</p>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__off__">
                                <span className="text-muted-foreground">{t("schedule.dayOff")}</span>
                              </SelectItem>
                              {activeShifts.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color ?? "#6366f1" }} />
                                    <span className="text-xs">{isBn ? s.nameBn : s.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={isPending} className="rounded-xl" onClick={() => saveSlots()}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pattern Card ─────────────────────────────────────────────────────────────

function PatternCard({
  pattern,
  onEdit,
  onSlots,
  onDelete,
}: {
  pattern:  RotationPattern;
  onEdit:   (p: RotationPattern) => void;
  onSlots:  (p: RotationPattern) => void;
  onDelete: (p: RotationPattern) => void;
}) {
  const { t, i18n } = useTranslation();
  const isBn        = i18n.language === "bn";

  const cycleLabel = () => {
    const n = pattern.cycleLength;
    if (pattern.cycleType === "daily")   return t("schedule.rotation.cycleDailyLabel",   { n });
    if (pattern.cycleType === "weekly")  return t("schedule.rotation.cycleWeeklyLabel",  { n });
    return t("schedule.rotation.cycleMonthlyLabel", { n });
  };

  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold truncate">
                {isBn ? pattern.nameBn : pattern.name}
              </CardTitle>
              {pattern.isDefault && (
                <Badge className="rounded-full h-4 px-2 text-[9px] bg-amber-500/15 text-amber-600 border-amber-500/30">
                  <Star className="h-2.5 w-2.5 mr-1" />{t("schedule.rotation.default")}
                </Badge>
              )}
              {!pattern.isActive && (
                <Badge variant="outline" className="rounded-full h-4 px-2 text-[9px]">
                  {t("schedule.rotation.inactive")}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{isBn ? pattern.name : pattern.nameBn}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onEdit(pattern)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => onDelete(pattern)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="outline" className="rounded-full text-xs">{cycleLabel()}</Badge>
          <span className="text-[10px] text-muted-foreground">{t("schedule.rotation.startDate")}: {pattern.startDate}</span>
        </div>
        <Button variant="outline" size="sm" className="w-full rounded-xl h-8 text-xs" onClick={() => onSlots(pattern)}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {t("schedule.rotation.slotEditor")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RotationPatterns() {
  const { t } = useTranslation();
  const { setSubtitle } = usePageSubtitle();
  useEffect(() => { setSubtitle(t("schedule.rotation.subtitle")); }, [t, setSubtitle]);

  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<RotationPattern | null>(null);
  const [slotsTarget, setSlotsTarget] = useState<RotationPattern | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RotationPattern | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: patterns = [], isLoading } = useQuery({
    queryKey: ["rotation-patterns"],
    queryFn:  fetchPatterns,
    staleTime: 30_000,
  });

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => apiDeletePattern(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rotation-patterns"] });
      toast({ title: t("schedule.rotation.deleted") });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: t("common.error"), variant: "destructive" }),
  });

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            {t("schedule.rotation.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("schedule.rotation.subtitle")}</p>
        </div>
        <Button className="rounded-xl h-9 gap-1.5" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          {t("schedule.rotation.addPattern")}
        </Button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : patterns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <RefreshCw className="h-7 w-7 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold">{t("schedule.rotation.noPatterns")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("schedule.rotation.noPatternsDesc")}</p>
          </div>
          <Button className="rounded-xl" onClick={() => { setEditTarget(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />{t("schedule.rotation.addPattern")}
          </Button>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {patterns.map((p) => (
            <motion.div key={p.id} variants={fadeInUp}>
              <PatternCard
                pattern={p}
                onEdit={(pat) => { setEditTarget(pat); setShowForm(true); }}
                onSlots={setSlotsTarget}
                onDelete={setDeleteTarget}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pattern Form Dialog */}
      <PatternFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        pattern={editTarget}
      />

      {/* Slot Editor Dialog */}
      {slotsTarget && (
        <SlotEditorDialog
          open={!!slotsTarget}
          onClose={() => setSlotsTarget(null)}
          pattern={slotsTarget}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("schedule.rotation.deletePattern")}</AlertDialogTitle>
            <AlertDialogDescription>{t("schedule.rotation.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => deleteTarget && doDelete(deleteTarget.id)}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
