import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGetDashboardHeatmap } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useLocale } from "@/hooks/useLocale";
import { fadeInUp } from "@/lib/motion";

const DAY_LABELS_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HeatmapTooltip({ active, payload, label, formatCurrency, isBengali }: any) {
  if (!active || !payload?.length) return null;
  const dayLabels = isBengali ? DAY_LABELS_BN : DAY_LABELS_EN;
  const dayIndex = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(label);
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border/60 rounded-xl px-3.5 py-2.5 shadow-xl text-xs">
      <p className="text-muted-foreground text-[10px] mb-1">{dayIndex >= 0 ? dayLabels[dayIndex] : label}</p>
      <p className="font-bold text-foreground">{formatCurrency(payload[0]?.value ?? 0)}</p>
      <p className="text-[10px] text-muted-foreground">{payload[0]?.payload?.count ?? 0} লেনদেন</p>
    </div>
  );
}

export function SalesHeatmap() {
  const { t } = useTranslation();
  const { formatCurrency, isBengali } = useLocale();
  const { data, isLoading } = useGetDashboardHeatmap();

  const dayLabels = isBengali ? DAY_LABELS_BN : DAY_LABELS_EN;
  const DAY_KEYS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dayMap = new Map((data ?? []).map((d) => [d.dayOfWeek, d]));
  const chartData = DAY_KEYS.map((key, idx) => {
    const entry = dayMap.get(idx);
    return {
      day:   key,
      label: dayLabels[idx],
      total: entry?.total ?? 0,
      count: entry?.count ?? 0,
    };
  });

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);

  const getColor = (total: number) => {
    const intensity = total / maxTotal;
    if (intensity === 0)   return "hsl(var(--muted))";
    if (intensity < 0.25)  return "#bfdbfe";
    if (intensity < 0.5)   return "#60a5fa";
    if (intensity < 0.75)  return "#3b82f6";
    return "#1d4ed8";
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border border-border/60 shadow-sm h-full">
        <CardHeader className="pb-0 pt-4 sm:pt-5 px-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
              <LayoutGrid className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{t("dashboard.heatmap")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{t("dashboard.heatmapDesc")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-1 sm:px-2 pt-3 pb-4">
          {isLoading ? (
            <Skeleton className="h-36 w-full rounded-xl" />
          ) : (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false} axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}
                    width={36}
                  />
                  <Tooltip content={<HeatmapTooltip formatCurrency={formatCurrency} isBengali={isBengali} />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={getColor(entry.total)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center justify-end gap-1.5 mt-2 px-2">
            <span className="text-[9px] text-muted-foreground">{t("dashboard.lowActivity")}</span>
            {["#bfdbfe", "#60a5fa", "#3b82f6", "#1d4ed8"].map((c) => (
              <div key={c} className="h-2.5 w-5 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-[9px] text-muted-foreground">{t("dashboard.highActivity")}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
