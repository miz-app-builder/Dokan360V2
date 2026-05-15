import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGetDueReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, CheckCircle2, User } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { fadeInUp, staggerContainer } from "@/lib/motion";

export function DueAnalytics() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const { data, isLoading } = useGetDueReport();

  const topCustomers = (data?.items ?? []).slice(0, 6);
  const maxDue = topCustomers[0]?.due ?? 1;

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border border-border/60 shadow-sm h-full">
        <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0">
                <CreditCard className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">{t("dashboard.dueAnalytics")}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{t("dashboard.topDueCustomers")}</CardDescription>
              </div>
            </div>
            {!isLoading && data && data.customerCount > 0 && (
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-destructive">{formatCurrency(data.totalDue)}</p>
                <p className="text-[10px] text-muted-foreground">{data.customerCount} {t("dashboard.dueCustomers")}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pt-4 pb-5">
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-xl" />)}
            </div>
          ) : topCustomers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-xs text-muted-foreground">{t("dashboard.noDueCustomers")}</p>
            </div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-2.5">
              {topCustomers.map((customer, i) => {
                const pct = maxDue > 0 ? (customer.due / maxDue) * 100 : 0;
                return (
                  <motion.div key={customer.id} variants={fadeInUp} className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-red-500/8 border border-red-500/12 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-red-500/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-semibold truncate text-foreground">{customer.name}</p>
                        <span className="text-xs font-bold text-destructive shrink-0 ml-2">{formatCurrency(customer.due)}</span>
                      </div>
                      <div className="h-1 bg-muted/70 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: i * 0.06 }}
                        />
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
