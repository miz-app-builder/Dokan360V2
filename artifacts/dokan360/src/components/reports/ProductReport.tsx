import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import {
  useGetProductReport,
  getGetProductReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Package, TrendingUp, Hash, DollarSign } from "lucide-react";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { ExportToolbar } from "./ExportToolbar";
import { ReportKpiCard } from "./ReportKpiCard";

function defaultRange(): DateRange {
  const d = new Date(); d.setDate(1);
  return { from: d.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
}

export function ProductReport() {
  const { formatCurrency, formatNumber } = useLocale();
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { data, isLoading } = useGetProductReport(
    { from: range.from, to: range.to },
    { query: { queryKey: getGetProductReportQueryKey({ from: range.from, to: range.to }) } },
  );

  const items = data?.items ?? [];
  const top10  = items.slice(0, 10);

  const excelData = items.map((r, i) => ({
    rank:          i + 1,
    productNameBn: r.productNameBn,
    totalQty:      r.totalQty,
    revenue:       r.revenue,
    cost:          r.cost,
    profit:        r.profit,
    transactions:  r.transactions,
  }));

  const excelCols = [
    { header: "ক্রম",         key: "rank",          width: 8  },
    { header: "পণ্যের নাম",  key: "productNameBn", width: 28 },
    { header: "পরিমাণ",      key: "totalQty",      width: 12 },
    { header: "রাজস্ব",      key: "revenue",       width: 16 },
    { header: "খরচ",         key: "cost",          width: 16 },
    { header: "মুনাফা",      key: "profit",        width: 16 },
    { header: "লেনদেন",      key: "transactions",  width: 12 },
  ];

  return (
    <div className="space-y-4" id="product-report-print">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">পণ্য বিক্রয় রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground mt-0.5">সর্বাধিক বিক্রীত পণ্য ও রাজস্ব বিশ্লেষণ</p>
        </div>
        <ExportToolbar
          printId="product-report-print"
          excelData={excelData as Record<string, unknown>[]}
          excelCols={excelCols}
          filename="পণ্য-রিপোর্ট"
          disabled={isLoading || !data}
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-4">
          <DateRangePicker value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ReportKpiCard icon={TrendingUp} label="মোট রাজস্ব"  value={formatCurrency(data.totalRevenue)}       variant="default" />
            <ReportKpiCard icon={Hash}       label="মোট পরিমাণ" value={formatNumber(data.totalQty)}              variant="success" />
            <ReportKpiCard icon={Package}    label="পণ্যের ধরন" value={`${formatNumber(data.totalProducts)} টি`} />
          </div>

          {top10.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">শীর্ষ ১০ পণ্য (রাজস্ব)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    layout="vertical"
                    data={top10}
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => "৳" + (v / 1000).toFixed(0) + "k"} />
                    <YAxis
                      type="category"
                      dataKey="productNameBn"
                      width={120}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "রাজস্ব"]} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {items.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">সম্পূর্ণ পণ্য তালিকা</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["#", "পণ্য", "পরিমাণ", "রাজস্ব", "মুনাফা", "লেনদেন"].map((h, i) => (
                          <th key={h} className={`px-4 py-2.5 font-medium text-muted-foreground ${i === 1 ? "text-left" : "text-right"} ${i === 0 ? "w-10" : ""}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {items.map((r, i) => (
                        <tr key={r.productId} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium max-w-[200px]">
                            <span className="truncate block">{r.productNameBn}</span>
                            {i === 0 && <Badge className="mt-0.5 h-4 text-[10px] bg-amber-500/10 text-amber-600 border-0">সেরা বিক্রয়</Badge>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(r.totalQty)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(r.revenue)}</td>
                          <td className={`px-4 py-2.5 text-right tabular-nums ${r.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                            {formatCurrency(r.profit)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.transactions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {items.length === 0 && (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <Package className="h-10 w-10 opacity-20" />
              <p className="text-sm">নির্বাচিত সময়ে কোনো বিক্রয় নেই</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
