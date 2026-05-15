import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGetProfitReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useLocale } from "@/hooks/useLocale";
import { fadeInUp } from "@/lib/motion";

function ProfitTooltip({ active, payload, label, formatCurrency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground text-[10px] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function ProfitTrendsChart() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();

  const params = useMemo(() => {
    const now = new Date();
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to   = now.toISOString().slice(0, 10);
    return { from, to };
  }, []);

  const { data, isLoading } = useGetProfitReport(params);

  const chartData = (data?.dailyBreakdown ?? []).map((d) => ({
    label:   d.date?.slice(5) ?? "",
    revenue: d.revenue,
    profit:  d.profit,
  }));

  const margin = data?.margin ?? 0;
  const isPositive = margin >= 0;

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border border-border/60 shadow-sm h-full">
        <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">{t("dashboard.revenueTrends")}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{t("dashboard.revenueTrendsDesc")}</CardDescription>
              </div>
            </div>
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600"}`}>
              {t("dashboard.margin")}: {margin.toFixed(1)}%
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-1 sm:px-2 pt-3 pb-4">
          {isLoading ? (
            <Skeleton className="h-40 sm:h-48 w-full rounded-xl" />
          ) : (
            <div className="h-40 sm:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => "৳" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                    width={40}
                  />
                  <Tooltip content={<ProfitTooltip formatCurrency={formatCurrency} />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  <Legend
                    formatter={(value) => value === "revenue" ? t("dashboard.revenueLabel") : t("dashboard.profitLabel")}
                    iconType="circle" iconSize={7}
                    wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }}
                  />
                  <Area type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
                  <Area type="monotone" dataKey="profit"  name="profit"  stroke="#10b981" strokeWidth={2} fill="url(#profitGrad)"  dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
