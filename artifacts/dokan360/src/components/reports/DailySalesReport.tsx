import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import {
  useGetSalesReport,
  getGetSalesReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, ShoppingCart, ReceiptText,
  Percent, Banknote, AlertCircle,
} from "lucide-react";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { ExportToolbar } from "./ExportToolbar";
import { ReportKpiCard } from "./ReportKpiCard";

function defaultRange(): DateRange {
  const d = new Date(); d.setDate(1);
  return { from: d.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
}

export function DailySalesReport() {
  const { formatCurrency, formatNumber } = useLocale();
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { data, isLoading } = useGetSalesReport(
    { from: range.from, to: range.to },
    { query: { queryKey: getGetSalesReportQueryKey({ from: range.from, to: range.to }) } },
  );

  const daily = data?.dailyBreakdown ?? [];

  const excelData = daily.map((r) => ({
    date:         r.date,
    total:        r.total,
    transactions: r.transactions,
  }));

  const excelCols = [
    { header: "তারিখ",       key: "date",         width: 14 },
    { header: "মোট বিক্রয়", key: "total",        width: 16 },
    { header: "লেনদেন",      key: "transactions", width: 12 },
  ];

  return (
    <div className="space-y-4" id="daily-sales-print">
      {/* Header + controls */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">দৈনিক বিক্রয় রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground mt-0.5">তারিখ অনুযায়ী বিক্রয় বিশ্লেষণ</p>
        </div>
        <ExportToolbar
          printId="daily-sales-print"
          excelData={excelData as Record<string, unknown>[]}
          excelCols={excelCols}
          filename="দৈনিক-বিক্রয়-রিপোর্ট"
          disabled={isLoading || !data}
        />
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-4">
          <DateRangePicker value={range} onChange={setRange} />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ReportKpiCard icon={TrendingUp}   label="মোট বিক্রয়"   value={formatCurrency(data.totalSales)}                          variant="default" />
            <ReportKpiCard icon={ShoppingCart} label="মোট লেনদেন"  value={`${formatNumber(data.totalTransactions)} টি`}             variant="success" />
            <ReportKpiCard icon={ReceiptText}  label="গড় অর্ডার"   value={formatCurrency(Math.round(data.avgOrderValue))} />
            <ReportKpiCard icon={Banknote}     label="মোট পরিশোধ"  value={formatCurrency(data.totalPaid)}                           variant="success" />
            <ReportKpiCard icon={Percent}      label="মোট ছাড়"     value={formatCurrency(data.totalDiscount)}                       variant="warning" />
            <ReportKpiCard icon={AlertCircle}  label="মোট বাকি"    value={formatCurrency(data.totalDue)}                            variant={data.totalDue > 0 ? "danger" : "success"} />
          </div>

          {daily.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">দৈনিক বিক্রয় চার্ট</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "৳" + (v / 1000).toFixed(0) + "k"} />
                    <Tooltip
                      formatter={(v: number, name: string) => [
                        formatCurrency(v as number),
                        name === "total" ? "বিক্রয়" : "লেনদেন",
                      ]}
                      labelFormatter={(l) => "তারিখ: " + l}
                    />
                    <Bar dataKey="total" name="total" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {daily.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">দৈনিক বিশ্লেষণ</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">তারিখ</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">বিক্রয়</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">লেনদেন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {daily.map((r) => (
                        <tr key={r.date} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-mono text-xs">{r.date}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium">{formatCurrency(r.total)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.transactions} টি</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-muted/30">
                      <tr>
                        <td className="px-4 py-2.5 font-semibold">সর্বমোট</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold">{formatCurrency(data.totalSales)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{data.totalTransactions} টি</td>
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
