import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { HrAnalytics } from "@workspace/api-client-react";
import { Trophy, AlarmClock } from "lucide-react";

type Props = { data: HrAnalytics };

function badgeColor(pct: number): string {
  if (pct >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (pct >= 70) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export function TopPerformersTable({ data }: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Performers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            {t("hrAnalytics.topPerformers.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("hrAnalytics.noData")}</p>
          ) : (
            <div className="space-y-3">
              {data.topPerformers.map((emp, idx) => (
                <div key={emp.employeeId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">#{idx + 1}</span>
                      <span className="font-medium truncate max-w-[140px]">{emp.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor(emp.attendancePercent)}`}>
                      {emp.attendancePercent}%
                    </span>
                  </div>
                  <Progress value={emp.attendancePercent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {emp.presentDays}/{emp.workingDays} {t("hrAnalytics.topPerformers.days")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Late Leaders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlarmClock className="h-4 w-4 text-amber-500" />
            {t("hrAnalytics.lateLeaders.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.lateLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("hrAnalytics.lateLeaders.empty")}</p>
          ) : (
            <div className="space-y-3">
              {data.lateLeaders.map((emp, idx) => (
                <div key={emp.employeeId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">#{idx + 1}</span>
                    <span className="font-medium truncate max-w-[140px]">{emp.name}</span>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                    {emp.lateMinutes} {t("hrAnalytics.min")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
