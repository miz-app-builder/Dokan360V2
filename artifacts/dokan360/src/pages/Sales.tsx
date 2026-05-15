import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListSales, useGetSale, getGetSaleQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Eye, Printer, Receipt, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";
import { useLocale } from "@/hooks/useLocale";

const PAYMENT_COLORS: Record<string, string> = {
  cash:   "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0",
  mobile: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-0",
  card:   "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-0",
  credit: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-0",
};

/* ── Sale detail dialog ──────────────────────────────────────── */
function SaleDetailDialog({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocale();
  const { data: sale, isLoading } = useGetSale(saleId, { query: { queryKey: getGetSaleQueryKey(saleId) } });

  const paymentLabels: Record<string, string> = {
    cash:   t("sales.cash"),
    mobile: t("sales.mobile"),
    card:   t("sales.card"),
    credit: t("sales.credit"),
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            {isLoading ? t("sales.loading") : sale?.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        ) : sale ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm bg-muted/40 rounded-xl p-3.5 border border-border/50">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{t("sales.date")}</p>
                <p className="font-semibold">{formatDate(sale.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{t("sales.customer")}</p>
                <p className="font-semibold">{sale.customerName ?? t("sales.generalCustomerShort")}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{t("sales.paymentMethod")}</p>
                <Badge className={`text-[10px] h-5 px-2 ${PAYMENT_COLORS[sale.paymentMethod] ?? "border-0 bg-muted"}`}>
                  {paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{t("sales.itemsHeader")}</p>
              <ScrollArea className="max-h-44 rounded-xl border border-border/50 bg-muted/20">
                <div className="divide-y divide-border/40">
                  {(sale.items ?? []).map((item: { productNameBn: string; quantity: number; subtotal: number | string }, i: number) => (
                    <div key={i} className="flex justify-between text-sm px-3.5 py-2.5">
                      <div className="min-w-0">
                        <span className="font-medium truncate">{item.productNameBn}</span>
                        <span className="text-muted-foreground ml-2 text-xs">×{item.quantity}</span>
                      </div>
                      <span className="tabular-nums font-semibold ml-3 shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("sales.subtotal")}</span>
                <span>{formatCurrency(Number(sale.total) + Number(sale.discount))}</span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("sales.discount")}</span>
                  <span>−{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>{t("sales.total")}</span>
                <span className="text-primary">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("sales.paid")}</span>
                <span>{formatCurrency(sale.paid)}</span>
              </div>
              {Number(sale.due) > 0 && (
                <div className="flex justify-between text-destructive font-semibold">
                  <span>{t("sales.due")}</span>
                  <span>{formatCurrency(sale.due)}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 h-11 rounded-xl touch-manipulation"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              {t("sales.printBtn")}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function Sales() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocale();
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [viewId, setViewId]               = useState<number | null>(null);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");

  const params = {
    ...(dateFrom ? { from: dateFrom } : {}),
    ...(dateTo   ? { to: dateTo }     : {}),
  };
  const { data: sales, isLoading } = useListSales(Object.keys(params).length ? params : undefined);
  const hasDateFilter = Boolean(dateFrom || dateTo);

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
  }

  const paymentLabels: Record<string, string> = {
    cash:   t("sales.cash"),
    mobile: t("sales.mobile"),
    card:   t("sales.card"),
    credit: t("sales.credit"),
  };

  type SaleRow = { id: number; invoiceNumber: string; createdAt: string; customerName?: string | null; itemCount: number; total: number | string; due: number | string; paymentMethod: string };
  const filtered = (sales ?? [] as SaleRow[]).filter((s: SaleRow) =>
    !invoiceFilter ||
    s.invoiceNumber.toLowerCase().includes(invoiceFilter.toLowerCase()) ||
    (s.customerName ?? "").includes(invoiceFilter),
  );

  return (
    <div className="space-y-5 max-w-screen-2xl mx-auto">


      {/* Search + Date Filter */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 h-10 rounded-xl border-border/70 bg-card w-64"
              placeholder={t("sales.searchPlaceholder")}
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{t("sales.dateFrom")}</Label>
              <Input
                type="date"
                className="h-10 rounded-xl border-border/70 bg-card w-40 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">{t("sales.dateTo")}</Label>
              <Input
                type="date"
                className="h-10 rounded-xl border-border/70 bg-card w-40 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {hasDateFilter && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-muted/60 shrink-0"
                title={t("sales.clearFilter")}
                onClick={clearDateFilter}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">

          {/* Loading */}
          {isLoading && (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* ── Mobile card list (< sm) ── */}
          {!isLoading && filtered.length > 0 && (
            <div className="sm:hidden divide-y divide-border/40">
              {filtered.map((s: SaleRow, idx: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-xs text-foreground truncate">{s.invoiceNumber}</p>
                      <Badge className={`text-[10px] h-4 px-1.5 shrink-0 ${PAYMENT_COLORS[s.paymentMethod] ?? "border-0 bg-muted text-muted-foreground"}`}>
                        {paymentLabels[s.paymentMethod] ?? s.paymentMethod}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(s.createdAt)} · {s.customerName ?? t("sales.generalCustomer")} · {t("sales.itemsCount", { count: s.itemCount })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm tabular-nums">{formatCurrency(s.total)}</p>
                    {Number(s.due) > 0
                      ? <span className="text-[10px] font-semibold text-destructive">{t("sales.duePrefix")} {formatCurrency(s.due)}</span>
                      : <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{t("sales.paidStatus")}</span>
                    }
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 rounded-xl shrink-0 touch-manipulation"
                    onClick={() => setViewId(s.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── Desktop table (sm+) ── */}
          {!isLoading && filtered.length > 0 && (
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("sales.invoiceHeader")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("sales.customer")}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("sales.paymentMethod")}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("sales.total")}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t("common.status")}</th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((s: SaleRow, idx: number) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.22 }}
                      className="hover:bg-muted/25 transition-colors group cursor-default"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-semibold text-xs text-foreground">{s.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(s.createdAt)} · {t("sales.itemsCount", { count: s.itemCount })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-muted-foreground text-sm">
                        {s.customerName ?? t("sales.generalCustomer")}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <Badge className={`text-[10px] h-5 px-2 ${PAYMENT_COLORS[s.paymentMethod] ?? "border-0 bg-muted text-muted-foreground"}`}>
                          {paymentLabels[s.paymentMethod] ?? s.paymentMethod}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums">{formatCurrency(s.total)}</td>
                      <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                        {Number(s.due) > 0
                          ? <Badge variant="destructive" className="text-[10px] h-5 px-2">{t("sales.duePrefix")} {formatCurrency(s.due)}</Badge>
                          : <Badge className="text-[10px] h-5 px-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0">{t("sales.paidStatus")}</Badge>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/60"
                          onClick={() => setViewId(s.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filtered.length === 0 && (
            <motion.div initial="hidden" animate="visible" variants={scaleIn}
              className="flex flex-col items-center py-16 text-muted-foreground gap-3"
            >
              <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center">
                <FileText className="h-7 w-7 opacity-30" />
              </div>
              <p className="text-sm font-medium">{t("sales.noSales")}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {viewId && <SaleDetailDialog saleId={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}
