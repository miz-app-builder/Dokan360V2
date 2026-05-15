import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useGetWeeklySchedule,
  useCreateSchedule,
  useDeleteSchedule,
  useListShifts,
  getGetWeeklyScheduleQueryKey,
  type WeeklyDaySlot,
  type Shift,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;

function ShiftPicker({
  slot,
  shifts,
  onAssign,
  onRemove,
  isLoading,
}: {
  slot: WeeklyDaySlot;
  shifts: Shift[];
  onAssign: (shiftId: number | null) => void;
  onRemove: () => void;
  isLoading: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  if (slot.scheduleId) {
    if (!slot.shiftId) {
      return (
        <div className="group relative flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all bg-red-500/10 text-red-600 border border-red-500/20">
          <span className="truncate max-w-[70px]">{t("schedule.dayOff")}</span>
          <button
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </button>
        </div>
      );
    }

    const displayName = i18n.language === "bn"
      ? (slot.shiftNameBn ?? slot.shiftName ?? "—")
      : (slot.shiftName ?? slot.shiftNameBn ?? "—");

    return (
      <div
        className="group relative flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
        style={{
          backgroundColor: (slot.shiftColor ?? "#6366f1") + "20",
          color: slot.shiftColor ?? "#6366f1",
          border: `1px solid ${slot.shiftColor ?? "#6366f1"}40`,
        }}
      >
        <span className="truncate max-w-[70px]">{displayName}</span>
        <button
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-8 w-full flex items-center justify-center rounded-md border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all group">
          <Plus className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="center">
        <p className="text-xs font-medium px-2 py-1 text-muted-foreground">{t("schedule.assignShift")}</p>
        <button
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-sm transition-colors text-left"
          onClick={() => { onAssign(null); setOpen(false); }}
          disabled={isLoading}
        >
          <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-red-500" />
          <span className="truncate text-red-600 font-medium">{t("schedule.dayOff")}</span>
        </button>
        {shifts.length > 0 && (
          <div className="border-t border-border/50 mt-1 pt-1 space-y-0.5">
            {shifts.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm transition-colors text-left"
                onClick={() => { onAssign(s.id); setOpen(false); }}
                disabled={isLoading}
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate">
                  {i18n.language === "bn" ? s.nameBn : s.name}
                </span>
              </button>
            ))}
          </div>
        )}
        {shifts.length === 0 && (
          <p className="text-xs text-center py-3 text-muted-foreground">{t("schedule.noShifts")}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function WeeklyScheduleTab() {
  const { t }       = useTranslation();
  const { toast }   = useToast();
  const queryClient = useQueryClient();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const { data, isLoading: isLoadingSchedule } = useGetWeeklySchedule();
  const { data: shiftsData = [] }               = useListShifts();
  const createMut  = useCreateSchedule();
  const deleteMut  = useDeleteSchedule();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetWeeklyScheduleQueryKey() });

  async function handleAssign(employeeId: number, weekday: number, shiftId: number | null) {
    const key = `${employeeId}-${weekday}`;
    setLoadingKey(key);
    try {
      await createMut.mutateAsync({
        data: {
          employeeId,
          ...(shiftId !== null && { shiftId }),
          type: "weekly" as const,
          weekday,
        },
      });
      toast({ title: t("schedule.assignSuccess") });
      invalidate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast({
        title: msg.includes("already exists") ? t("schedule.conflictError") : t("schedule.assignFailed"),
        variant: "destructive",
      });
    } finally {
      setLoadingKey(null);
    }
  }

  async function handleRemove(scheduleId: number, employeeId: number, weekday: number) {
    const key = `${employeeId}-${weekday}`;
    setLoadingKey(key);
    try {
      await deleteMut.mutateAsync({ id: scheduleId });
      toast({ title: t("schedule.removeSuccess") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setLoadingKey(null);
    }
  }

  if (isLoadingSchedule) {
    return (
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const rows  = data?.rows ?? [];
  const shifts = data?.shifts ?? shiftsData;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
          <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("employees.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shifts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shifts.map((s) => (
            <Badge key={s.id} variant="outline" className="text-xs gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.nameBn}
              <span className="text-muted-foreground">{s.startTime}–{s.endTime}</span>
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <ScrollArea className="w-full">
          <div className="min-w-[640px]">
            <div className="grid border-b" style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}>
              <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-r">
                {t("employees.name")}
              </div>
              {WEEKDAY_KEYS.map((wd) => (
                <div
                  key={wd}
                  className={cn(
                    "px-2 py-2.5 text-center text-xs font-semibold",
                    (wd === "5" || wd === "6") && "text-red-500/80",
                  )}
                >
                  {t(`schedule.weekdaysShort.${wd}`)}
                </div>
              ))}
            </div>

            {rows.map((row, idx) => (
              <div
                key={row.employeeId}
                className={cn(
                  "grid border-b last:border-b-0",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                )}
                style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}
              >
                <div className="px-4 py-2.5 border-r flex flex-col justify-center min-h-[52px]">
                  <p className="text-sm font-medium truncate">{row.employeeName}</p>
                  {row.employeeCode && (
                    <p className="text-xs text-muted-foreground">{row.employeeCode}</p>
                  )}
                </div>

                {row.days.map((slot: WeeklyDaySlot) => {
                  const cellKey = `${row.employeeId}-${slot.weekday}`;
                  const isProcessing = loadingKey === cellKey;
                  return (
                    <div
                      key={slot.weekday}
                      className={cn(
                        "px-1.5 py-2 flex items-center justify-center",
                        (slot.weekday === 5 || slot.weekday === 6) && "bg-red-50/50 dark:bg-red-950/10",
                      )}
                    >
                      <div className="w-full">
                        {isProcessing ? (
                          <div className="flex justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <ShiftPicker
                            slot={slot}
                            shifts={shifts}
                            isLoading={isProcessing}
                            onAssign={(shiftId) => handleAssign(row.employeeId, slot.weekday, shiftId)}
                            onRemove={() => slot.scheduleId && handleRemove(slot.scheduleId, row.employeeId, slot.weekday)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  );
}
