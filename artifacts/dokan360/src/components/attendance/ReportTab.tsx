import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  useGetAttendanceReport,
  customFetch,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type EmpBasic = { id: number; name: string; employeeCode: string | null };

const MONTHS = [
  { v: "1",  bn: "জানুয়ারি",  en: "January"   },
  { v: "2",  bn: "ফেব্রুয়ারি", en: "February"  },
  { v: "3",  bn: "মার্চ",      en: "March"     },
  { v: "4",  bn: "এপ্রিল",     en: "April"     },
  { v: "5",  bn: "মে",         en: "May"       },
  { v: "6",  bn: "জুন",        en: "June"      },
  { v: "7",  bn: "জুলাই",      en: "July"      },
  { v: "8",  bn: "আগস্ট",      en: "August"    },
  { v: "9",  bn: "সেপ্টেম্বর",  en: "September" },
  { v: "10", bn: "অক্টোবর",    en: "October"   },
  { v: "11", bn: "নভেম্বর",    en: "November"  },
  { v: "12", bn: "ডিসেম্বর",   en: "December"  },
];

function pctColor(pct: number): string {
  if (pct >= 90) return "text-emerald-600";
  if (pct >= 70) return "text-amber-600";
  return "text-red-600";
}

function pctBg(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-red-500";
}

export function ReportTab() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const now  = new Date();

  const [year,       setYear]       = useState(String(now.getFullYear()));
  const [month,      setMonth]      = useState(String(now.getMonth() + 1));
  const [employeeId, setEmployeeId] = useState("all");

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  const { data: empList } = useQuery({
    queryKey: ["employees-basic"],
    queryFn:  () => customFetch<EmpBasic[]>("/api/employees?status=active&limit=200"),
  });

  const { data: report, isLoading } = useGetAttendanceReport({
    year:       Number(year),
    month:      Number(month),
    ...(employeeId !== "all" && { employeeId: Number(employeeId) }),
  });

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="border border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-32 text-sm">
                <SelectValue placeholder={t("attendance.selectYear")} />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9 w-40 text-sm">
                <SelectValue placeholder={t("attendance.selectMonth")} />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.v} value={m.v}>
                    {isBn ? m.bn : m.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-9 w-48 text-sm">
                <SelectValue placeholder={t("attendance.employeeSelect")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("attendance.allEmployees")}</SelectItem>
                {(empList ?? []).map((emp) => (
                  <SelectItem key={emp.id} value={String(emp.id)}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {report && (
        <p className="text-sm text-muted-foreground">
          {t("attendance.workingDays", { days: report.workingDays })}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : !report?.data?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3 className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>{t("attendance.noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {report.data.map((emp) => (
            <Card key={emp.employeeId} className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-sm">{emp.employeeName}</p>
                    {emp.employeeCode && <p className="text-xs text-muted-foreground">{emp.employeeCode}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-2xl font-bold", pctColor(emp.attendancePercent))}>
                      {emp.attendancePercent}%
                    </p>
                    <p className="text-xs text-muted-foreground">{t("attendance.attendancePercent")}</p>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-muted rounded-full mb-3">
                  <div
                    className={cn("h-full rounded-full", pctBg(emp.attendancePercent))}
                    style={{ width: `${Math.min(100, emp.attendancePercent)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {[
                    { label: t("attendance.present"), value: emp.present,  cls: "text-emerald-600" },
                    { label: t("attendance.late"),    value: emp.late,     cls: "text-amber-600"   },
                    { label: t("attendance.absent"),  value: emp.absent,   cls: "text-red-600"     },
                    { label: t("attendance.halfDay"), value: emp.halfDay,  cls: "text-orange-600"  },
                    { label: t("attendance.leave"),   value: emp.leave,    cls: "text-purple-600"  },
                    { label: t("attendance.holiday"), value: emp.holiday,  cls: "text-blue-600"    },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-muted/40 rounded p-2">
                      <p className={cn("text-base font-bold", cls)}>{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {(emp.lateMinutesTotal > 0 || emp.overtimeMinutesTotal > 0) && (
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {emp.lateMinutesTotal > 0 && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                        {t("attendance.lateMinutes", { minutes: emp.lateMinutesTotal })}
                      </Badge>
                    )}
                    {emp.overtimeMinutesTotal > 0 && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                        {t("attendance.overtimeMinutes", { minutes: emp.overtimeMinutesTotal })}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
