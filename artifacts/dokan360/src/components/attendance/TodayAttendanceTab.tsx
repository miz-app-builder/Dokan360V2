import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useGetTodayAttendance,
  useCheckIn,
  useCheckOut,
  getGetTodayAttendanceQueryKey,
  getListAttendanceQueryKey,
  type TodayAttendanceItem,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, LogOut, Users, Clock, UserCheck, UserX, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceStatus = TodayAttendanceItem["status"];

const STATUS_CONFIG: Record<
  NonNullable<AttendanceStatus> | "notMarked",
  { label_key: string; className: string }
> = {
  present:   { label_key: "attendance.status_present",  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  late:      { label_key: "attendance.status_late",     className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  absent:    { label_key: "attendance.status_absent",   className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  half_day:  { label_key: "attendance.status_half_day", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  holiday:   { label_key: "attendance.status_holiday",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  leave:     { label_key: "attendance.status_leave",    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  notMarked: { label_key: "attendance.notMarked",       className: "bg-muted text-muted-foreground" },
};

function fmtTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function TodayAttendanceTab() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const qc          = useQueryClient();
  const { toast }  = useToast();

  const { data, isLoading } = useGetTodayAttendance();
  const checkInMut  = useCheckIn();
  const checkOutMut = useCheckOut();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getGetTodayAttendanceQueryKey() });
    qc.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
  }

  function handleCheckIn(empId: number) {
    checkInMut.mutate(
      { data: { employeeId: empId } },
      {
        onSuccess: () => { toast({ title: t("attendance.checkInSuccess") }); invalidate(); },
        onError:   (e: Error) => toast({ title: t("attendance.checkInFailed"), description: e.message, variant: "destructive" }),
      },
    );
  }

  function handleCheckOut(empId: number) {
    checkOutMut.mutate(
      { data: { employeeId: empId } },
      {
        onSuccess: () => { toast({ title: t("attendance.checkOutSuccess") }); invalidate(); },
        onError:   (e: Error) => toast({ title: t("attendance.checkOutFailed"), description: e.message, variant: "destructive" }),
      },
    );
  }

  const summary = data?.summary;

  const statCards = [
    { icon: Users,     labelKey: "attendance.totalEmployees", value: summary?.total     ?? 0, color: "text-slate-600" },
    { icon: UserCheck, labelKey: "attendance.totalPresent",   value: summary?.present   ?? 0, color: "text-emerald-600" },
    { icon: Clock,     labelKey: "attendance.totalLate",      value: summary?.late      ?? 0, color: "text-amber-600" },
    { icon: UserX,     labelKey: "attendance.totalAbsent",    value: summary?.absent    ?? 0, color: "text-red-600" },
    { icon: AlertCircle, labelKey: "attendance.totalNotMarked", value: summary?.notMarked ?? 0, color: "text-muted-foreground" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map(({ icon: Icon, labelKey, value, color }) => (
          <Card key={labelKey} className="border border-border/50">
            <CardContent className="p-4 flex flex-col items-center gap-1 text-center">
              <Icon className={cn("h-5 w-5", color)} />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{t(labelKey)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's date */}
      <p className="text-sm text-muted-foreground">
        {data?.date && new Date(data.date).toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </p>

      {/* Employee List */}
      {(!data?.data || data.data.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>{t("attendance.noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.data.map((emp) => {
            const statusKey = (emp.status ?? "notMarked") as NonNullable<AttendanceStatus> | "notMarked";
            const cfg = STATUS_CONFIG[statusKey];
            const isBusy = checkInMut.isPending || checkOutMut.isPending;
            const canCheckIn  = !emp.checkIn;
            const canCheckOut = !!emp.checkIn && !emp.checkOut;

            return (
              <Card key={emp.employeeId} className="border border-border/50">
                <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {emp.employeeName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{emp.employeeName}</p>
                    {emp.employeeCode && (
                      <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {emp.checkIn && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <LogIn className="h-3 w-3" /> {fmtTime(emp.checkIn, locale)}
                        </span>
                      )}
                      {emp.checkOut && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <LogOut className="h-3 w-3" /> {fmtTime(emp.checkOut, locale)}
                        </span>
                      )}
                      {emp.lateMinutes > 0 && (
                        <span className="text-xs text-amber-600">
                          {t("attendance.lateMinutes", { minutes: emp.lateMinutes })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge className={cn("shrink-0 border-0 text-xs font-medium", cfg.className)}>
                    {t(cfg.label_key)}
                  </Badge>

                  {/* Actions */}
                  <div className="flex gap-1.5 shrink-0">
                    {canCheckIn && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                        onClick={() => handleCheckIn(emp.employeeId)}
                        disabled={isBusy}
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("attendance.checkIn")}</span>
                      </Button>
                    )}
                    {canCheckOut && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
                        onClick={() => handleCheckOut(emp.employeeId)}
                        disabled={isBusy}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t("attendance.checkOut")}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
