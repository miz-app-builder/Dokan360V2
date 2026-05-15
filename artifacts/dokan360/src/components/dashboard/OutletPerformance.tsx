import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGetProfitReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Store } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { fadeInUp, staggerContainer } from "@/lib/motion";

function GrowthBadge({ pct }: { pct: number }) {
  const isPos = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isPos ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600"}`}>
      {isPos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function OutletPerformance() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useLocale();

  const thisMonthParams = useMemo(() => {
    const now = new Date();
    return {
      from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      to:   now.toISOString().slice(0, 10),
    };
  }, []);

  const lastMonthParams = useMemo(() => {
    const now = new Date();
    const y   = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const m   = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    return {
      from: `${y}-${String(m).padStart(2, "0")}-01`,
      to:   `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }, []);

  const { data: thisMonth, isLoading: thisLoading } = useGetProfitReport(thisMonthParams);
  const { data: lastMonth, isLoading: lastLoading  } = useGetProfitReport(lastMonthParams);

  const isLoading = thisLoading || lastLoading;

  const growth = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

  const revenueGrowth = growth(thisMonth?.totalRevenue ?? 0, lastMonth?.totalRevenue ?? 0);
  const profitGrowth  = growth(thisMonth?.totalProfit  ?? 0, lastMonth?.totalProfit  ?? 0);
  const txGrowth      = growth(thisMonth?.totalTransactions ?? 0, lastMonth?.totalTransactions ?? 0);

  const thisAvg = (thisMonth?.totalTransactions ?? 0) > 0
    ? (thisMonth?.totalRevenue ?? 0) / (thisMonth?.totalTransactions ?? 1)
    : 0;
  const lastAvg = (lastMonth?.totalTransactions ?? 0) > 0
    ? (lastMonth?.totalRevenue ?? 0) / (lastMonth?.totalTransactions ?? 1)
    : 0;
  const avgGrowth = growth(thisAvg, lastAvg);

  const metrics = [
    { label: t("dashboard.totalRevenue"),  this: thisMonth?.totalRevenue   ?? 0, last: lastMonth?.totalRevenue   ?? 0, growth: revenueGrowth, isCurrency: true  },
    { label: t("dashboard.totalProfit"),   this: thisMonth?.totalProfit    ?? 0, last: lastMonth?.totalProfit    ?? 0, growth: profitGrowth,  isCurrency: true  },
    { label: t("dashboard.avgOrderValue"), this: thisAvg,                        last: lastAvg,                        growth: avgGrowth,     isCurrency: true  },
    { label: t("dashboard.transactions"),  this: thisMonth?.totalTransactions ?? 0, last: lastMonth?.totalTransactions ?? 0, growth: txGrowth,   isCurrency: false },
  ];

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border border-border/60 shadow-sm h-full">
        <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{t("dashboard.outletPerformance")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{t("dashboard.outletPerformanceDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pt-4 pb-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2.5">
              {metrics.map((m) => (
                <motion.div key={m.label} variants={fadeInUp}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/30"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {m.isCurrency ? formatCurrency(m.this) : formatNumber(m.this)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <GrowthBadge pct={m.growth} />
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {t("dashboard.lastMonth")}: {m.isCurrency ? formatCurrency(m.last) : formatNumber(m.last)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
