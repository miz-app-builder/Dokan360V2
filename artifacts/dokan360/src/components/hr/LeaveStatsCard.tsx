import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { HrAnalytics } from "@workspace/api-client-react";
import { Umbrella } from "lucide-react";

type Props = { data: HrAnalytics };

export function LeaveStatsCard({ data }: Props) {
  const { t } = useTranslation();
  const { totalRequests, pending, approved, rejected, byType } = data.leave;

  const statusData = [
    { name: t("hrAnalytics.leave.pending"),  value: pending,  color: "#f59e0b" },
    { name: t("hrAnalytics.leave.approved"), value: approved, color: "#22c55e" },
    { name: t("hrAnalytics.leave.rejected"), value: rejected, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Umbrella className="h-4 w-4 text-emerald-500" />
          {t("hrAnalytics.leave.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{totalRequests}</span>
          <span className="text-muted-foreground text-sm">{t("hrAnalytics.leave.totalRequests")}</span>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 flex-wrap">
          {pending  > 0 && <Badge variant="outline" className="text-amber-600 border-amber-300">{t("hrAnalytics.leave.pending")}: {pending}</Badge>}
          {approved > 0 && <Badge variant="outline" className="text-emerald-600 border-emerald-300">{t("hrAnalytics.leave.approved")}: {approved}</Badge>}
          {rejected > 0 && <Badge variant="outline" className="text-red-500 border-red-300">{t("hrAnalytics.leave.rejected")}: {rejected}</Badge>}
        </div>

        {/* Status bar chart */}
        {statusData.length > 0 && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* By type */}
        {byType.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{t("hrAnalytics.leave.byType")}</p>
            {byType.map((lt) => (
              <div key={lt.leaveTypeName} className="flex justify-between text-xs">
                <span>{lt.leaveTypeName}</span>
                <Badge variant="secondary">{lt.count}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
