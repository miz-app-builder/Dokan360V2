import { useLocale } from "@/hooks/useLocale";
import {
  useGetDueReport,
  getGetDueReportQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, AlertCircle, TrendingDown } from "lucide-react";
import { ExportToolbar } from "./ExportToolbar";
import { ReportKpiCard } from "./ReportKpiCard";

export function DueReport() {
  const { formatCurrency, formatNumber } = useLocale();
  const { data, isLoading } = useGetDueReport({
    query: { queryKey: getGetDueReportQueryKey() },
  });

  const items = data?.items ?? [];
  const top10  = [...items].sort((a, b) => b.due - a.due).slice(0, 10);

  const excelData = items.map((c, i) => ({
    rank:          i + 1,
    name:          c.name,
    phone:         c.phone ?? "",
    due:           c.due,
    totalPurchase: c.totalPurchase,
  }));

  const excelCols = [
    { header: "ক্রম",          key: "rank",          width: 8  },
    { header: "গ্রাহকের নাম",  key: "name",          width: 24 },
    { header: "ফোন",           key: "phone",         width: 16 },
    { header: "বাকি",          key: "due",           width: 16 },
    { header: "মোট কেনাকাটা", key: "totalPurchase", width: 18 },
  ];

  return (
    <div className="space-y-4" id="due-report-print">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">বাকি রিপোর্ট</h2>
          <p className="text-xs text-muted-foreground mt-0.5">বকেয়া গ্রাহকদের তালিকা ও মোট বাকির পরিমাণ</p>
        </div>
        <ExportToolbar
          printId="due-report-print"
          excelData={excelData as Record<string, unknown>[]}
          excelCols={excelCols}
          filename="বাকি-রিপোর্ট"
          disabled={isLoading || !data}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-56 rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ReportKpiCard icon={AlertCircle}  label="মোট বাকি"       value={formatCurrency(data.totalDue)}          variant="danger"   />
            <ReportKpiCard icon={Users}        label="বকেয়া গ্রাহক"  value={`${formatNumber(data.customerCount)} জন`} variant="warning"  />
          </div>

          {top10.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium">শীর্ষ ১০ বকেয়া গ্রাহক</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    layout="vertical"
                    data={top10}
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => "৳" + (v / 1000).toFixed(0) + "k"} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                    />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "বাকি"]} />
                    <Bar dataKey="due" fill="hsl(var(--destructive))" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {items.length > 0 ? (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">সম্পূর্ণ বকেয়া তালিকা</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {["#", "গ্রাহক", "ফোন", "বাকি", "মোট কেনাকাটা"].map((h, i) => (
                          <th key={h} className={`px-4 py-2.5 font-medium text-muted-foreground ${i <= 1 ? "text-left" : "text-right"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {items.map((c, i) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 text-right text-muted-foreground text-xs w-10">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium">{c.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{c.phone ?? "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-destructive">
                            {formatCurrency(c.due)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatCurrency(c.totalPurchase)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border bg-muted/30">
                      <tr>
                        <td colSpan={3} className="px-4 py-2.5 font-semibold">{data.customerCount} জন গ্রাহক</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-bold text-destructive">{formatCurrency(data.totalDue)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
              <TrendingDown className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">কোনো বকেয়া নেই — চমৎকার!</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
