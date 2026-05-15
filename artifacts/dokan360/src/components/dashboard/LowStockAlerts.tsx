import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGetInventoryReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Package } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export function LowStockAlerts() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetInventoryReport();

  const lowStockItems = (data?.items ?? []).filter((i) => i.isLowStock).slice(0, 6);
  const outOfStock    = lowStockItems.filter((i) => i.stockQuantity === 0);
  const nearEmpty     = lowStockItems.filter((i) => i.stockQuantity > 0);

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border border-border/60 shadow-sm h-full">
        <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">{t("dashboard.lowStockAlerts")}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{t("dashboard.lowStockAlertsDesc")}</CardDescription>
              </div>
            </div>
            {!isLoading && lowStockItems.length > 0 && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full shrink-0">
                {lowStockItems.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pt-4 pb-5">
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-xl" />)}
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-xs text-muted-foreground">{t("dashboard.noLowStock")}</p>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2">
              {outOfStock.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">স্টক শেষ ({outOfStock.length})</p>
              )}
              {lowStockItems.map((item) => {
                const pct = item.minStockLevel > 0
                  ? Math.min((item.stockQuantity / item.minStockLevel) * 100, 100)
                  : 0;
                const isOut = item.stockQuantity === 0;
                return (
                  <motion.div key={item.id} variants={fadeInUp}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${isOut ? "border-destructive/20 bg-destructive/5" : "border-orange-500/15 bg-orange-500/5"}`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isOut ? "bg-destructive/10" : "bg-orange-500/10"}`}>
                      <Package className={`h-3.5 w-3.5 ${isOut ? "text-destructive" : "text-orange-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">{item.nameBn}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1 bg-muted/70 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isOut ? "bg-destructive" : "bg-orange-500"}`}
                            style={{ width: `${Math.max(pct, isOut ? 0 : 5)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] font-bold shrink-0 ${isOut ? "text-destructive" : "text-orange-600 dark:text-orange-400"}`}>
                          {item.stockQuantity} / {item.minStockLevel}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
