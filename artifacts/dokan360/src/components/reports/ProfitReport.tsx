import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import {
  useGetProfitReport,
  getGetProfitReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, ShoppingCart } from "lucide-react";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { ExportToolbar } from "./ExportToolbar";
import { ReportKpiCard } from "./ReportKpiCard";

function defaultRange(): DateRange {
  const d = new Date(); d.setDate(1);
  return { from: d.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
}

export function ProfitReport() {
  const { formatCurrency, formatNumber } = useLocale();
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { data, isLoading } = useGetProfitReport(
    { from: range.from, to: range.to },
    { query: { queryKey: getGetProfitReportQueryKey({ from: range.from, to: range.to }) } },
  );

  const daily = data?.dailyBreakdown ?? [];

  const excelData = daily.map((r) => ({
    date:    r.date,
    revenue: r.revenue,
    cost:    r.cost,
    profit:  r.profit,
  }));

  const excelCols = [
    { header: "তারিখ",   key: "date",    width: 14 },
    { header: "রাজস্ব", key: "revenue", width: 16 },
    { header: "খরচ",    key: "cost",    width: 16 },
    { header: "মুনাফা", key: "profit",  width: 16 },
  ];

  return (
    <div className="space-y-4" id="profit-print">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">মুনাফা রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground mt-0.5">রাজস্ব, খরচ ও মুনাফা বিশ্লেষণ</p>
        </div>
        <ExportToolbar
          printId="profit-print"
          excelData={excelData as Record<string, unknown>[]}
          excelCols={excelCols}
          filename="মুনাফা-রিপোর্ট"
          disabled={isLoading || !data}
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-4">
          <DateRangePicker value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ReportKpiCard icon={DollarSign}   label="মোট রাজস্ব"   value={formatCurrency(data.totalRevenue)}                         variant="default" />
            <ReportKpiCard icon={TrendingDown} label="মোট খরচ"      value={formatCurrency(data.totalCost)}                            variant="warning" />
            <ReportKpiCard icon={TrendingUp}   label="মোট মুনাফা"   value={formatCurrency(data.totalProfit)}                          variant={data.totalProfit >= 0 ? "success" : "danger"} />
            <ReportKpiCard icon={Percent}      label="মুনাফার হার"  value={`${data.margin.toFixed(1)}%`}                             variant={data.margin >= 20 ? "success" : data.margin > 0 ? "warning" : "danger"} />
            <ReportKpiCard icon={ShoppingCart} label="মোট লেনদেন"  value={`${formatNumber(data.totalTransactions)} টি`} />
          </div>

          {daily.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">রাজস্ব বনাম খরচ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "৳" + (v / 1000).toFixed(0) + "k"} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        "৳" + v.toLocaleString(),
                        name === "revenue" ? "রাজস্ব" : name === "cost" ? "খরচ" : "মুনাফা",
                      ]}
                    />
                    <Legend formatter={(v) => v === "revenue" ? "রাজস্ব" : v === "cost" ? "খরচ" : "মুনাফা"} />
                    <Bar dataKey="revenue" name="revenue" fill="hsl(var(--primary))"   radius={[3, 3, 0, 0]} />
                    <Bar dataKey="cost"    name="cost"    fill="hsl(var(--destructive)/0.6)" radius={[3, 3, 0, 0]} />
                    <Line dataKey="profit" name="profit"  stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {daily.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">দৈনিক মুনাফা বিশ্লেষণ</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["তারিখ", "রাজস্ব", "খরচ", "মুনাফা", "হার"].map((h) => (
                          <th key={h} className="text-right first:text-left px-4 py-2.5 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {daily.map((r) => {
                        const margin = r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) : "0.0";
                        return (
                          <tr key={r.date} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5 font-mono text-xs">{r.date}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">৳{r.revenue.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">৳{r.cost.toLocaleString()}</td>
                            <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${r.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                              ৳{r.profit.toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground text-xs">{margin}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-muted/30">
                      <tr>
                        <td className="px-4 py-2.5 font-semibold">সর্বমোট</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold">৳{data.totalRevenue.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-muted-foreground">৳{data.totalCost.toLocaleString()}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${data.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                          ৳{data.totalProfit.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{data.margin.toFixed(1)}%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {daily.length === 0 && (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <TrendingUp className="h-10 w-10 opacity-20" />
              <p className="text-sm">নির্বাচিত সময়ে কোনো বিক্রয় নেই</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
