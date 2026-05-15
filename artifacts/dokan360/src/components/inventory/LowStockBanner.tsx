import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface LowStockItem {
  id: number;
  nameBn: string;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
}

interface LowStockBannerProps {
  items:        LowStockItem[];
  onAdjustItem: (item: LowStockItem) => void;
}

export function LowStockBanner({ items, onAdjustItem }: LowStockBannerProps) {
  if (items.length === 0) return null;

  const outOfStock = items.filter((i) => i.stockQuantity === 0);
  const lowOnly    = items.filter((i) => i.stockQuantity > 0);

  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-orange-500/20">
        <div className="h-7 w-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
            মজুদ সতর্কতা
          </p>
          <p className="text-xs text-muted-foreground">
            {outOfStock.length > 0
              ? `${outOfStock.length} টি পণ্যের স্টক শেষ, ${lowOnly.length} টিতে কম মজুদ`
              : `${items.length} টি পণ্যে মজুদ ন্যূনতম সীমার নিচে`}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {outOfStock.length > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
              {outOfStock.length} শেষ
            </Badge>
          )}
          {lowOnly.length > 0 && (
            <Badge className="text-[10px] h-5 px-1.5 bg-orange-500/15 text-orange-700 dark:text-orange-300 border-0">
              {lowOnly.length} কম
            </Badge>
          )}
        </div>
      </div>

      {/* Item list — show top 5 */}
      <div className="divide-y divide-orange-500/10">
        {items.slice(0, 5).map((item) => {
          const isOut = item.stockQuantity === 0;
          const pct   = Math.min(
            100,
            Math.round((item.stockQuantity / Math.max(item.minStockLevel, 1)) * 100)
          );
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-500/5 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{item.nameBn}</p>
                  {isOut ? (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1 shrink-0">
                      শেষ
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] h-4 px-1 bg-orange-500/15 text-orange-700 dark:text-orange-300 border-0 shrink-0">
                      কম
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOut ? "bg-destructive" : "bg-orange-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.stockQuantity} / {item.minStockLevel} {item.unit}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 shrink-0"
                onClick={() => onAdjustItem(item)}
              >
                মজুদ যোগ
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
        {items.length > 5 && (
          <div className="px-4 py-2 text-xs text-muted-foreground text-center">
            আরও {items.length - 5} টি পণ্যে কম মজুদ — নিচের তালিকায় দেখুন
          </div>
        )}
      </div>
    </div>
  );
}
