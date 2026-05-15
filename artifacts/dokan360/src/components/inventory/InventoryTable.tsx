import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ArrowUpDown,
  History,
  AlertTriangle,
  Boxes,
  Filter,
} from "lucide-react";
import type { AdjustTarget } from "./StockAdjustDialog";

/* ─── Types ──────────────────────────────────────────────────── */
interface InventoryItemLike {
  id:            number;
  nameBn:        string;
  nameEn?:       string | null;
  sku?:          string | null;
  stockQuantity: number;
  minStockLevel: number;
  unit:          string;
  categoryName?: string | null;
  isLowStock:    boolean;
}

interface InventoryTableProps {
  items:         InventoryItemLike[];
  isLoading:     boolean;
  onAdjust:      (item: AdjustTarget) => void;
  onShowHistory: (item: AdjustTarget) => void;
}

/* ─── Stock bar ──────────────────────────────────────────────── */
function StockBar({ qty, min }: { qty: number; min: number }) {
  const pct = min > 0 ? Math.min(100, Math.round((qty / (min * 2)) * 100)) : 100;
  const out  = qty === 0;
  const low  = !out && qty <= min;
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all ${
            out ? "bg-destructive" : low ? "bg-orange-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold tabular-nums ${
        out ? "text-destructive" : low ? "text-orange-600 dark:text-orange-400" : "text-foreground"
      }`}>
        {qty}
      </span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export function InventoryTable({ items, isLoading, onAdjust, onShowHistory }: InventoryTableProps) {
  const { t } = useTranslation();
  const [search,      setSearch]      = React.useState("");
  const [stockFilter, setStockFilter] = React.useState<"all" | "low" | "out">("all");

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.nameBn.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (item.sku?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStock =
      stockFilter === "all"   ? true
      : stockFilter === "out" ? item.stockQuantity === 0
      : item.isLowStock;
    return matchSearch && matchStock;
  });

  const lowCount = items.filter((i) => i.isLowStock).length;
  const outCount = items.filter((i) => i.stockQuantity === 0).length;

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 h-10 rounded-xl"
            placeholder={t("inventory.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as typeof stockFilter)}>
          <SelectTrigger className="w-[150px] h-10 rounded-xl">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.filterAllProducts")}</SelectItem>
            <SelectItem value="low">
              {t("inventory.filterLow")}
              {lowCount > 0 && (
                <Badge className="ml-1.5 text-[10px] h-4 w-4 p-0 rounded-full bg-orange-500 text-white border-0 inline-flex items-center justify-center">
                  {lowCount}
                </Badge>
              )}
            </SelectItem>
            <SelectItem value="out">
              {t("inventory.filterOut")}
              {outCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 w-4 p-0 rounded-full inline-flex items-center justify-center">
                  {outCount}
                </Badge>
              )}
            </SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums shrink-0">
          {t("inventory.itemsCount", { count: filtered.length })}
        </span>
      </div>

      {/* ── Table/Card ── */}
      <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">

        {/* Loading */}
        {isLoading && (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* ── Mobile card list (< sm) ── */}
        {!isLoading && filtered.length > 0 && (
          <div className="sm:hidden divide-y divide-border/40">
            {filtered.map((item) => {
              const isOut = item.stockQuantity === 0;
              const isLow = !isOut && item.isLowStock;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{item.nameBn}</p>
                      {isOut && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      {isLow && !isOut && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <StockBar qty={item.stockQuantity} min={item.minStockLevel} />
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost" size="icon"
                      className="h-10 w-10 rounded-xl touch-manipulation"
                      onClick={() => onShowHistory(item)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-10 w-10 rounded-xl touch-manipulation"
                      onClick={() => onAdjust(item)}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Desktop table (sm+) ── */}
        {!isLoading && filtered.length > 0 && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("inventory.product")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("inventory.category")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("inventory.currentStock")}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t("inventory.minStockHeader")}</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("common.status")}</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((item) => {
                  const isOut = item.stockQuantity === 0;
                  const isLow = !isOut && item.isLowStock;
                  return (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground truncate max-w-[200px]">{item.nameBn}</p>
                        {item.sku && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">SKU: {item.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {item.categoryName
                          ? <Badge variant="secondary" className="text-xs font-normal">{item.categoryName}</Badge>
                          : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StockBar qty={item.stockQuantity} min={item.minStockLevel} />
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                          {isOut && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                          {isLow && !isOut && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {item.minStockLevel} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {isOut ? (
                          <Badge variant="destructive" className="text-[10px] h-5 px-2">{t("inventory.filterOut")}</Badge>
                        ) : isLow ? (
                          <Badge className="text-[10px] h-5 px-2 bg-orange-500/12 text-orange-700 dark:text-orange-400 border-0">{t("inventory.filterLow")}</Badge>
                        ) : (
                          <Badge className="text-[10px] h-5 px-2 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-0">{t("inventory.normal")}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onShowHistory(item)}>
                                <History className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("inventory.historyTooltip")}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAdjust(item)}>
                                <ArrowUpDown className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("inventory.adjustTooltip")}</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <Boxes className="h-7 w-7 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t("inventory.noItems")}</p>
              <p className="text-xs mt-0.5">{t("inventory.changeFilter")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
