import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDashboardSummary,
  useGetRecentSales,
  useGetTopProducts,
  getGetDashboardSummaryQueryKey,
  getGetRecentSalesQueryKey,
  getGetTopProductsQueryKey,
  getGetSalesChartQueryKey,
  getGetDashboardAnalyticsQueryKey,
  getGetDashboardHeatmapQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle,
  Users, CreditCard, BarChart3, Trophy, Receipt, Zap,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useLocale } from "@/hooks/useLocale";
import { fadeInUp, staggerContainer } from "@/lib/motion";

import { AnalyticsChart }    from "@/components/dashboard/AnalyticsChart";
import { ProfitTrendsChart } from "@/components/dashboard/ProfitTrendsChart";
import { LowStockAlerts }    from "@/components/dashboard/LowStockAlerts";
import { DueAnalytics }      from "@/components/dashboard/DueAnalytics";
import { SalesHeatmap }      from "@/components/dashboard/SalesHeatmap";
import { OutletPerformance } from "@/components/dashboard/OutletPerformance";

/* ── KPI color configs ───────────────────────────────────────── */
const KPI_CONFIGS = [
  { gradFrom: "from-emerald-500/15", gradTo: "to-emerald-500/5",  border: "border-emerald-500/15", iconBg: "bg-emerald-500/12", icon: TrendingUp,    iconColor: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  { gradFrom: "from-violet-500/15",  gradTo: "to-violet-500/5",   border: "border-violet-500/15",  iconBg: "bg-violet-500/12",  icon: BarChart3,     iconColor: "text-violet-600 dark:text-violet-400",  dot: "bg-violet-500" },
  { gradFrom: "from-blue-500/15",    gradTo: "to-blue-500/5",     border: "border-blue-500/15",    iconBg: "bg-blue-500/12",    icon: Package,       iconColor: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-500" },
  { gradFrom: "from-orange-500/15",  gradTo: "to-orange-500/5",   border: "border-orange-500/15",  iconBg: "bg-orange-500/12",  icon: AlertTriangle, iconColor: "text-orange-600 dark:text-orange-400",  dot: "bg-orange-500" },
  { gradFrom: "from-cyan-500/15",    gradTo: "to-cyan-500/5",     border: "border-cyan-500/15",    iconBg: "bg-cyan-500/12",    icon: Users,         iconColor: "text-cyan-600 dark:text-cyan-400",      dot: "bg-cyan-500" },
  { gradFrom: "from-red-500/15",     gradTo: "to-red-500/5",      border: "border-red-500/15",     iconBg: "bg-red-500/12",     icon: CreditCard,    iconColor: "text-red-600 dark:text-red-400",        dot: "bg-red-500" },
];

/* ── KPI Card ────────────────────────────────────────────────── */
interface KpiCardProps { title: string; value: string; sub?: string; configIdx: number; }

function KpiCard({ title, value, sub, configIdx }: KpiCardProps) {
  const cfg  = KPI_CONFIGS[configIdx % KPI_CONFIGS.length];
  const Icon = cfg.icon;
  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -2, transition: { duration: 0.18 } }}>
      <Card className={`relative overflow-hidden border ${cfg.border} shadow-sm hover:shadow-md transition-shadow duration-200 cursor-default`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradFrom} ${cfg.gradTo} pointer-events-none`} />
        <CardContent className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                {title}
              </p>
              <p className="text-xl sm:text-[26px] font-bold mt-1 sm:mt-1.5 tabular-nums text-foreground leading-none tracking-tight">
                {value}
              </p>
              {sub && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 flex items-center gap-1.5 truncate">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  {sub}
                </p>
              )}
            </div>
            <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl ${cfg.iconBg} border border-white/10 flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${cfg.iconColor}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KpiSkeleton() {
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Dashboard ───────────────────────────────────────────────── */
export default function Dashboard() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useLocale();
  const qc = useQueryClient();

  const { data: summary,     isLoading: sumLoading }  = useGetDashboardSummary();
  const { data: recentSales, isLoading: salesLoading } = useGetRecentSales();
  const { data: topProducts, isLoading: topLoading }   = useGetTopProducts();

  useEffect(() => {
    const invalidateDashboard = () => {
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      qc.invalidateQueries({ queryKey: getGetRecentSalesQueryKey() });
      qc.invalidateQueries({ queryKey: getGetTopProductsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSalesChartQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardAnalyticsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardHeatmapQueryKey() });
    };
    const invalidateInventory = () => {
      qc.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    };

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales" }, invalidateDashboard)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sale_items" }, () => {})
      .on("postgres_changes", { event: "*",      schema: "public", table: "inventory_adjustments" }, invalidateInventory)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const kpiItems = [
    { title: t("dashboard.todaySales"),    value: formatCurrency(summary?.todaySales),         sub: t("dashboard.transactions",  { count: summary?.todayTransactions  ?? 0 }) },
    { title: t("dashboard.monthSales"),    value: formatCurrency(summary?.monthSales),          sub: t("dashboard.transactions",  { count: summary?.monthTransactions  ?? 0 }) },
    { title: t("dashboard.totalProducts"), value: formatNumber(summary?.totalProducts ?? 0),   sub: t("dashboard.activeProducts") },
    { title: t("dashboard.lowStock"),      value: formatNumber(summary?.lowStockCount  ?? 0),  sub: t("dashboard.needsAttention") },
    { title: t("dashboard.totalCustomers"),value: formatNumber(summary?.totalCustomers ?? 0),  sub: t("dashboard.registeredCustomers") },
    { title: t("dashboard.totalDue"),      value: formatCurrency(summary?.totalDue),            sub: t("dashboard.customersDue") },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 max-w-screen-2xl mx-auto">

      {/* Live data badge */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-end">
        <Badge variant="secondary" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold">
          <Zap className="h-3 w-3 text-emerald-500 fill-emerald-500" />
          {t("dashboard.liveData")}
        </Badge>
      </motion.div>

      {/* ── KPI Grid ───────────────────────────────────────────── */}
      {sumLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4"
        >
          {kpiItems.map((item, i) => (
            <KpiCard key={item.title} {...item} configIdx={i} />
          ))}
        </motion.div>
      )}

      {/* ── Row 1: Period-selectable Analytics Chart + Top Products ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
        <div className="xl:col-span-2">
          <AnalyticsChart />
        </div>

        {/* Top Products */}
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
          <Card className="border border-border/60 shadow-sm h-full">
            <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-amber-500/12 border border-amber-500/15 flex items-center justify-center shrink-0">
                  <Trophy className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">{t("dashboard.topProducts")}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{t("dashboard.bestSelling")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-5 pt-4 pb-5">
              {topLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-xl" />)}
                </div>
              ) : (topProducts ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noTopProducts")}</p>
              ) : (
                <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
                  {(topProducts ?? []).slice(0, 7).map((p, i) => {
                    const maxRev = Number(topProducts![0].totalRevenue);
                    const pct    = maxRev > 0 ? (Number(p.totalRevenue) / maxRev) * 100 : 0;
                    const rankStyle = [
                      "text-amber-500 bg-amber-500/10",
                      "text-slate-400 bg-slate-400/10",
                      "text-orange-400 bg-orange-400/10",
                    ][i] ?? "text-muted-foreground bg-muted/60";
                    return (
                      <motion.div key={p.productId} variants={fadeInUp}>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className={`text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${rankStyle}`}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">{p.productNameBn}</p>
                            <p className="text-[9px] text-muted-foreground">{formatNumber(p.totalQuantity)} {t("dashboard.soldQty")}</p>
                          </div>
                          <span className="text-xs font-bold text-primary shrink-0">{formatCurrency(p.totalRevenue)}</span>
                        </div>
                        <div className="ml-7 h-1 bg-muted/70 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 2: Profit Trends (full width) ──────────────────── */}
      <ProfitTrendsChart />

      {/* ── Row 3: Low Stock Alerts + Due Analytics ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <LowStockAlerts />
        <DueAnalytics   />
      </div>

      {/* ── Row 4: Heatmap + Outlet Performance ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-5">
        <div className="xl:col-span-2">
          <SalesHeatmap />
        </div>
        <OutletPerformance />
      </div>

      {/* ── Row 5: Recent Sales ────────────────────────────────── */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">{t("dashboard.recentSales")}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{t("dashboard.latestTransactions")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 pt-4 pb-3">
            {salesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[56px] rounded-xl" />)}
              </div>
            ) : (recentSales ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{t("dashboard.noRecentSales")}</p>
            ) : (
              <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="divide-y divide-border/40">
                {(recentSales ?? []).map((s) => (
                  <motion.div
                    key={s.id}
                    variants={fadeInUp}
                    className="flex items-center justify-between py-3 sm:py-3.5 gap-3 sm:gap-4 group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{s.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.customerName ?? t("dashboard.generalCustomer")} · {s.itemCount} {t("dashboard.products")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums">{formatCurrency(s.total)}</p>
                      {Number(s.due) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full mt-0.5">
                          {t("dashboard.due")} {formatCurrency(s.due)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-0.5">
                          ✓ {t("dashboard.paid")}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
