import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGetHrAnalytics } from "@workspace/api-client-react";
import { AppLayout } from "@/layouts/AppLayout";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { AttendanceStatsCard } from "@/components/hr/AttendanceStatsCard";
import { PayrollStatsCard }    from "@/components/hr/PayrollStatsCard";
import { LeaveStatsCard }      from "@/components/hr/LeaveStatsCard";
import { TopPerformersTable }  from "@/components/hr/TopPerformersTable";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Month/year helpers ───────────────────────────────────────────────────────

const MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function buildYears(): number[] {
  const cur = new Date().getFullYear();
  const years: number[] = [];
  for (let y = cur; y >= 2020; y--) years.push(y);
  return years;
}

// ─── Summary stat card ────────────────────────────────────────────────────────

type StatTileProps = { label: string; value: string | number; sub?: string; color?: string };

function StatTile({ label, value, sub, color = "text-foreground" }: StatTileProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HrAnalytics() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { setSubtitle } = usePageSubtitle();
  useEffect(() => { setSubtitle(t("hrAnalytics.subtitle")); }, [setSubtitle, t]);

  const now   = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const months = isBn ? MONTHS_BN : MONTHS_EN;
  const years  = buildYears();

  // Navigate month
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const cur = new Date();
    if (year > cur.getFullYear() || (year === cur.getFullYear() && month >= cur.getMonth() + 1)) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const { data, isLoading, isError } = useGetHrAnalytics({ month, year });

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-violet-500" />
              {t("hrAnalytics.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("hrAnalytics.subtitle")}</p>
          </div>

          {/* Month/year picker */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="h-8 w-[120px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-8 w-[80px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-4 pb-3 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent></Card>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{t("hrAnalytics.loadError")}</AlertDescription>
          </Alert>
        )}

        {/* ── Data ── */}
        {data && (
          <>
            {/* KPI tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                label={t("hrAnalytics.tiles.totalEmployees")}
                value={data.totalActiveEmployees}
                sub={t("hrAnalytics.tiles.active")}
                color="text-indigo-600 dark:text-indigo-400"
              />
              <StatTile
                label={t("hrAnalytics.tiles.attendanceRate")}
                value={`${data.attendance.attendanceRate}%`}
                sub={t("hrAnalytics.tiles.thisMonth")}
                color={data.attendance.attendanceRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}
              />
              <StatTile
                label={t("hrAnalytics.tiles.totalNet")}
                value={`৳${data.payroll.totalNet.toLocaleString("en-BD")}`}
                sub={`${data.payroll.paidCount} ${t("hrAnalytics.payroll.paid")} / ${data.payroll.unpaidCount} ${t("hrAnalytics.payroll.unpaid")}`}
                color="text-yellow-600 dark:text-yellow-400"
              />
              <StatTile
                label={t("hrAnalytics.tiles.leaveRequests")}
                value={data.leave.totalRequests}
                sub={`${data.leave.pending} ${t("hrAnalytics.leave.pending")}`}
                color="text-teal-600 dark:text-teal-400"
              />
            </div>

            {/* Attendance + Payroll + Leave cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AttendanceStatsCard data={data} />
              <PayrollStatsCard    data={data} />
              <LeaveStatsCard      data={data} />
            </div>

            {/* Top performers + Late leaders */}
            <TopPerformersTable data={data} />
          </>
        )}

        {/* ── Empty state ── */}
        {data && data.totalActiveEmployees === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">{t("hrAnalytics.noEmployees")}</p>
            <p className="text-sm text-muted-foreground">{t("hrAnalytics.noEmployeesSub")}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
