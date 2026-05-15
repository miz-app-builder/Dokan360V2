import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListLeaveBalances, useListLeaveTypes } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

function BalanceBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((used / total) * 100));
  const isDanger = pct >= 90;
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: isDanger ? "#ef4444" : color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{used}/{total} {""}</span>
        <span className={cn(isDanger && "text-red-500 font-medium")}>{pct}%</span>
      </div>
    </div>
  );
}

export function LeaveBalancesTab() {
  const { t, i18n } = useTranslation();
  const isBn        = i18n.language === "bn";
  const now         = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const { data: balances = [], isLoading } = useListLeaveBalances({ year });
  const { data: leaveTypes = [] }          = useListLeaveTypes();

  // Group by employee
  const employeeMap = new Map<number, {
    name: string; code: string | null;
    balances: Array<{ leaveTypeId: number; leaveTypeName: string; leaveTypeNameBn: string; leaveTypeColor: string; totalDays: number; usedDays: number; remainingDays: number }>;
  }>();

  for (const b of balances) {
    if (!employeeMap.has(b.employeeId)) {
      employeeMap.set(b.employeeId, { name: b.employeeName, code: b.employeeCode ?? null, balances: [] });
    }
    employeeMap.get(b.employeeId)!.balances.push({
      leaveTypeId:     b.leaveTypeId,
      leaveTypeName:   b.leaveTypeName,
      leaveTypeNameBn: b.leaveTypeNameBn,
      leaveTypeColor:  b.leaveTypeColor,
      totalDays:       b.totalDays,
      usedDays:        b.usedDays,
      remainingDays:   b.remainingDays,
    });
  }

  const activeTypes = leaveTypes.filter((lt) => lt.isActive);
  const rows        = Array.from(employeeMap.entries());

  return (
    <div className="space-y-4">
      {/* Year navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[4rem] text-center">{year}</span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y + 1)} disabled={year >= now.getFullYear() + 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">{t("leaves.balanceDesc")}</span>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : rows.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-2">
          <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("leaves.noBalances")}</p>
        </CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <ScrollArea className="w-full">
            <div style={{ minWidth: `${180 + activeTypes.length * 160}px` }}>
              {/* Header */}
              <div
                className="grid border-b bg-muted/30"
                style={{ gridTemplateColumns: `180px repeat(${activeTypes.length}, 1fr)` }}
              >
                <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-r">
                  {t("employees.name")}
                </div>
                {activeTypes.map((lt) => (
                  <div key={lt.id} className="px-3 py-2.5 text-center text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lt.color }} />
                      {isBn ? lt.nameBn : lt.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {rows.map(([empId, emp], idx) => (
                <div
                  key={empId}
                  className={cn("grid border-b last:border-b-0", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}
                  style={{ gridTemplateColumns: `180px repeat(${activeTypes.length}, 1fr)` }}
                >
                  {/* Employee */}
                  <div className="px-4 py-3 border-r flex flex-col justify-center min-h-[60px]">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    {emp.code && <p className="text-xs text-muted-foreground">{emp.code}</p>}
                  </div>

                  {/* Balance cells */}
                  {activeTypes.map((lt) => {
                    const b = emp.balances.find((x) => x.leaveTypeId === lt.id);
                    if (!b) {
                      return (
                        <div key={lt.id} className="px-3 py-3 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">—</span>
                        </div>
                      );
                    }
                    return (
                      <div key={lt.id} className="px-3 py-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 h-5"
                            style={{ borderColor: lt.color + "60", color: lt.color }}
                          >
                            {b.remainingDays} {t("leaves.left")}
                          </Badge>
                        </div>
                        <BalanceBar used={b.usedDays} total={b.totalDays} color={lt.color} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Card>
      )}

      {/* Legend */}
      {activeTypes.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {activeTypes.map((lt) => (
            <div key={lt.id} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lt.color }} />
              <span>{isBn ? lt.nameBn : lt.name}</span>
              <span className="opacity-60">({lt.defaultDays} {t("leaves.daysPerYear")})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
