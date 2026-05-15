import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import {
  useGetStaffReport,
  getGetStaffReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, ShoppingCart, AlertCircle } from "lucide-react";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import { ExportToolbar } from "./ExportToolbar";
import { ReportKpiCard } from "./ReportKpiCard";

function defaultRange(): DateRange {
  const d = new Date(); d.setDate(1);
  return { from: d.toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) };
}

export function StaffReport() {
  const { formatCurrency, formatNumber } = useLocale();
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { data, isLoading } = useGetStaffReport(
    { from: range.from, to: range.to },
    { query: { queryKey: getGetStaffReportQueryKey({ from: range.from, to: range.to }) } },
  );

  const items = data?.items ?? [];

  const excelData = items.map((r, i) => ({
    rank:         i + 1,
    userName:     r.userName,
    totalSales:   r.totalSales,
    transactions: r.transactions,
    totalPaid:    r.totalPaid,
    totalDue:     r.totalDue,
  }));

  const excelCols = [
    { header: "ক্রম",        key: "rank",         width: 8  },
    { header: "কর্মী",       key: "userName",     width: 22 },
    { header: "মোট বিক্রয়", key: "totalSales",   width: 16 },
    { header: "লেনদেন",      key: "transactions", width: 12 },
    { header: "পরিশোধ",     key: "totalPaid",    width: 16 },
    { header: "বাকি",        key: "totalDue",     width: 16 },
  ];

  return (
    <div className="space-y-4" id="staff-report-print">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">কর্মী বিক্রয় রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground mt-0.5">প্রতিটি কর্মীর বিক্রয় পারফরম্যান্স</p>
        </div>
        <ExportToolbar
          printId="staff-report-print"
          excelData={excelData as Record<string, unknown>[]}
          excelCols={excelCols}
          filename="কর্মী-রিপোর্ট"
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
            <ReportKpiCard icon={TrendingUp}   label="মোট বিক্রয়"  value={formatCurrency(data.totalSales)}          variant="default" />
            <ReportKpiCard icon={ShoppingCart} label="মোট লেনদেন" value={`${formatNumber(data.totalTransactions)} টি`} variant="success" />
            <ReportKpiCard icon={Users}        label="কর্মী সংখ্যা" value={`${formatNumber(data.staffCount)} জন`} />
          </div>

          {items.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">কর্মী অনুযায়ী বিক্রয়</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(180, items.length * 48)}>
                  <BarChart
                    layout="vertical"
                    data={items}
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => "৳" + (v / 1000).toFixed(0) + "k"} />
                    <YAxis
                      type="category"
                      dataKey="userName"
                      width={110}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
                    />
                    <Tooltip formatter={(v: number) => ["৳" + v.toLocaleString(), "বিক্রয়"]} />
                    <Bar dataKey="totalSales" name="totalSales" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {items.length > 0 ? (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">কর্মীর বিস্তারিত</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["#", "কর্মী", "মোট বিক্রয়", "লেনদেন", "পরিশোধ", "বাকি"].map((h, i) => (
                          <th key={h} className={`px-4 py-2.5 font-medium text-muted-foreground ${i <= 1 ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {items.map((r, i) => (
                        <tr key={r.userId ?? r.userName} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-right text-muted-foreground text-xs w-10">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{r.userName}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold">৳{r.totalSales.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.transactions} টি</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">৳{r.totalPaid.toLocaleString()}</td>
                          <td className={`px-4 py-2.5 text-right tabular-nums ${r.totalDue > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            ৳{r.totalDue.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-muted/30">
                      <tr>
                        <td colSpan={2} className="px-4 py-2.5 font-semibold">{data.staffCount} জন কর্মী</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold">৳{data.totalSales.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{data.totalTransactions} টি</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <Users className="h-10 w-10 opacity-20" />
              <p className="text-sm">নির্বাচিত সময়ে কোনো বিক্রয় নেই</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
