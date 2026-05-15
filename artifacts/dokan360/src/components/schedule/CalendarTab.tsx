import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetCalendarSchedule, type CalendarDayAssignment } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;

function DayCell({
  date,
  weekday,
  assignments,
  isCurrentMonth,
}: {
  date: string;
  weekday: number;
  assignments: CalendarDayAssignment[];
  isCurrentMonth: boolean;
}) {
  const { t, i18n }  = useTranslation();
  const day    = parseInt(date.split("-")[2], 10);
  const isWeekend = weekday === 5 || weekday === 6;
  const today  = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  const scheduled  = assignments.filter((a) => !a.isHoliday);
  const onHoliday  = assignments.filter((a) => a.isHoliday);

  const preview = scheduled.slice(0, 2);
  const extra   = scheduled.length - 2;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "min-h-[90px] p-1.5 border-b border-r cursor-pointer hover:bg-muted/30 transition-colors",
            !isCurrentMonth && "opacity-30 bg-muted/10",
            isWeekend && "bg-red-50/40 dark:bg-red-950/10",
            isToday && "ring-1 ring-inset ring-primary/40",
          )}
        >
          {/* Day number */}
          <div className="flex items-center justify-between mb-1">
            <span
              className={cn(
                "text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full",
                isToday ? "bg-primary text-primary-foreground" : isWeekend ? "text-red-500/80" : "",
              )}
            >
              {day}
            </span>
            {onHoliday.length > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                {t("schedule.holiday")}
              </Badge>
            )}
          </div>

          {/* Shift assignments preview */}
          <div className="space-y-0.5">
            {preview.map((a) => {
              const shiftLabel = i18n.language === "bn"
                ? (a.shiftNameBn ?? a.shiftName)
                : (a.shiftName ?? a.shiftNameBn);
              return (
                <div
                  key={a.employeeId}
                  className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium"
                  style={{
                    backgroundColor: (a.shiftColor ?? "#6366f1") + "25",
                    color: a.shiftColor ?? "#6366f1",
                  }}
                >
                  {a.employeeName.split(" ")[0]}
                  {shiftLabel && <span className="opacity-70 ml-1">·{shiftLabel}</span>}
                </div>
              );
            })}
            {extra > 0 && (
              <p className="text-[10px] text-muted-foreground pl-1">+{extra} {t("schedule.more")}</p>
            )}
          </div>
        </div>
      </PopoverTrigger>

      {assignments.length > 0 && (
        <PopoverContent className="w-64 p-3" align="start">
          <p className="text-sm font-semibold mb-2">{date}</p>
          <div className="space-y-1.5">
            {assignments.map((a) => {
              const shiftLabel = i18n.language === "bn"
                ? (a.shiftNameBn ?? a.shiftName)
                : (a.shiftName ?? a.shiftNameBn);
              return (
              <div key={a.employeeId} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: a.isHoliday ? "#ef4444" : (a.shiftColor ?? "#6366f1") }}
                />
                <span className="flex-1 truncate">{a.employeeName}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: a.isHoliday ? "#ef444420" : (a.shiftColor ?? "#6366f1") + "20",
                    color: a.isHoliday ? "#ef4444" : (a.shiftColor ?? "#6366f1"),
                  }}
                >
                  {a.isHoliday ? t("schedule.holiday") : (shiftLabel ?? "—")}
                </span>
                {a.isOverride && (
                  <Badge variant="outline" className="text-[9px] px-1 h-3.5">{t("schedule.override")}</Badge>
                )}
              </div>
            ); })}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}

export function CalendarTab() {
  const { t } = useTranslation();
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useGetCalendarSchedule({ year, month });

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build calendar grid with padding for first day of month
  const firstWeekday = data?.days?.[0]?.weekday ?? new Date(year, month - 1, 1).getDay();
  const paddingCells = Array.from({ length: firstWeekday }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-base font-semibold">
            {t(`schedule.months.${month}`)} {year}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAY_KEYS.map((wd) => (
            <div
              key={wd}
              className={cn(
                "py-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0",
                (wd === "5" || wd === "6") && "text-red-500/80",
              )}
            >
              {t(`schedule.weekdaysShort.${wd}`)}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-[90px] rounded-none border-b border-r" />
            ))}
          </div>
        ) : !data ? (
          <CardContent className="flex flex-col items-center justify-center py-16 gap-2">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("schedule.noSchedule")}</p>
          </CardContent>
        ) : (
          <div className="grid grid-cols-7">
            {/* Padding cells for first day alignment */}
            {paddingCells.map((i) => (
              <div key={`pad-${i}`} className="min-h-[90px] border-b border-r bg-muted/10" />
            ))}

            {/* Day cells */}
            {data.days.map((day) => (
              <DayCell
                key={day.date}
                date={day.date}
                weekday={day.weekday}
                assignments={day.assignments}
                isCurrentMonth={true}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          {t("schedule.holiday")}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[9px] px-1 h-3.5">{t("schedule.override")}</Badge>
          {t("schedule.overrideDesc")}
        </div>
      </div>
    </div>
  );
}
