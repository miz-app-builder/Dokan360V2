import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { HrAnalytics } from "@workspace/api-client-react";
import { CalendarCheck, Clock, TrendingUp } from "lucide-react";

type Props = { data: HrAnalytics };

export function AttendanceStatsCard({ data }: Props) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const MONTH_NAMES_BN = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
  const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const trendData = data.attendance.monthlyTrend.map((item) => ({
    name:  isBn ? MONTH_NAMES_BN[item.month - 1] : MONTH_NAMES_EN[item.month - 1],
    rate:  item.attendanceRate,
    present: item.presentDays,
    absent:  item.absentDays,
  }));

  const { totalPresent, totalAbsent, totalLate, totalHalfDay, attendanceRate, avgLateMinutes, avgOvertimeMinutes } = data.attendance;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-teal-500" />
          {t("hrAnalytics.attendance.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rate + progress */}
        <div className="flex items-end gap-3">
          <span className="text-3xl font-bold">{attendanceRate}%</span>
          <Badge variant={attendanceRate >= 80 ? "default" : "destructive"} className="mb-1">
            {attendanceRate >= 80 ? t("hrAnalytics.attendance.good") : t("hrAnalytics.attendance.low")}
          </Badge>
        </div>
        <Progress value={attendanceRate} className="h-2" />

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.attendance.present")}</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{totalPresent}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.attendance.absent")}</p>
            <p className="font-semibold text-red-500">{totalAbsent}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.attendance.late")}</p>
            <p className="font-semibold text-amber-500">{totalLate}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.attendance.halfDay")}</p>
            <p className="font-semibold text-blue-500">{totalHalfDay}</p>
          </div>
        </div>

        {/* Avg late / OT */}
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t("hrAnalytics.attendance.avgLate")}: <strong>{avgLateMinutes}{t("hrAnalytics.min")}</strong>
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            {t("hrAnalytics.attendance.avgOT")}: <strong>{avgOvertimeMinutes}{t("hrAnalytics.min")}</strong>
          </span>
        </div>

        {/* 6-month trend chart */}
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v}%`, t("hrAnalytics.attendance.rate")]} />
              <Area type="monotone" dataKey="rate" stroke="#14b8a6" fill="url(#attGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
