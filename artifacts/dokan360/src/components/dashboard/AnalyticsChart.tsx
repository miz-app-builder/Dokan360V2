import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  useGetSalesChart,
  useGetDashboardAnalytics,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useLocale } from "@/hooks/useLocale";
import { fadeInUp } from "@/lib/motion";

type Period = "daily" | "week" | "month";

function ChartTooltip({ active, payload, label, formatCurrency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xl text-sm">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-bold text-foreground">{formatCurrency(payload[0]?.value ?? 0)}</p>
      {payload[1] && (
        <p className="text-xs text-muted-foreground mt-0.5">{payload[1]?.value} লেনদেন</p>
      )}
    </div>
  );
}

export function AnalyticsChart() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const [period, setPeriod] = useState<Period>("daily");

  const { data: dailyData,  isLoading: dailyLoading  } = useGetSalesChart();
  const { data: weekData,   isLoading: weekLoading   } = useGetDashboardAnalytics({ period: "week" });
  const { data: monthData,  isLoading: monthLoading  } = useGetDashboardAnalytics({ period: "month" });

  const isLoading = period === "daily" ? dailyLoading : period === "week" ? weekLoading : monthLoading;

  const chartData = period === "daily"
    ? (dailyData ?? []).map((d) => ({ label: d.date?.slice(5) ?? "", value: d.total, tx: d.transactions }))
    : period === "week"
    ? (weekData ?? []).map((d) => ({ label: d.label ?? "", value: d.total, tx: d.transactions }))
    : (monthData ?? []).map((d) => ({ label: d.label ?? "", value: d.total, tx: d.transactions }));

  const PERIODS: { key: Period; label: string }[] = [
    { key: "daily", label: t("dashboard.periodToday") },
    { key: "week",  label: t("dashboard.periodWeek")  },
    { key: "month", label: t("dashboard.periodMonth") },
  ];

  const subtitles: Record<Period, string> = {
    daily: t("dashboard.last30Days"),
    week:  "গত ১২ সপ্তাহের সাপ্তাহিক বিক্রয়",
    month: "গত ১২ মাসের মাসিক বিক্রয়",
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border border-border/60 shadow-sm h-full">
        <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-sm font-bold">{t("dashboard.salesAnalysis")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{subtitles[period]}</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted/60 border border-border/40 rounded-lg p-0.5">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold transition-all ${
                    period === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-1 sm:px-2 pt-4 pb-4">
          {isLoading ? (
            <Skeleton className="h-44 sm:h-56 w-full rounded-xl" />
          ) : (
            <div className="h-44 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => "৳" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                    width={44}
                  />
                  <Tooltip content={<ChartTooltip formatCurrency={formatCurrency} />} cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone" dataKey="value"
                    stroke="hsl(var(--primary))" strokeWidth={2.5}
                    fill="url(#analyticsGrad)" dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))", fill: "hsl(var(--primary))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
