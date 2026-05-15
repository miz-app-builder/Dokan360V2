import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { HrAnalytics } from "@workspace/api-client-react";
import { Banknote } from "lucide-react";

type Props = { data: HrAnalytics };

function fmt(n: number): string {
  return "৳" + n.toLocaleString("en-BD");
}

export function PayrollStatsCard({ data }: Props) {
  const { t } = useTranslation();
  const { totalGross, totalNet, avgNet, paidCount, unpaidCount, totalOvertimePay } = data.payroll;

  const pieData = [
    { name: t("hrAnalytics.payroll.paid"),   value: paidCount,   color: "#22c55e" },
    { name: t("hrAnalytics.payroll.unpaid"), value: unpaidCount, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Banknote className="h-4 w-4 text-yellow-500" />
          {t("hrAnalytics.payroll.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.payroll.totalNet")}</p>
            <p className="font-bold text-lg">{fmt(totalNet)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.payroll.totalGross")}</p>
            <p className="font-semibold">{fmt(totalGross)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.payroll.avgNet")}</p>
            <p className="font-semibold">{fmt(avgNet)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground text-xs">{t("hrAnalytics.payroll.overtime")}</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(totalOvertimePay)}</p>
          </div>
        </div>

        {/* Payment status badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-emerald-600 border-emerald-300">
            {t("hrAnalytics.payroll.paid")}: {paidCount}
          </Badge>
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            {t("hrAnalytics.payroll.unpaid")}: {unpaidCount}
          </Badge>
        </div>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={48} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, t("hrAnalytics.payroll.employees")]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
