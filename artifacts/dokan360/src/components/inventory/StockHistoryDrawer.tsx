import { useLocale } from "@/hooks/useLocale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useListInventoryAdjustments,
  getListInventoryAdjustmentsQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Package,
  Clock,
} from "lucide-react";
import type { AdjustTarget } from "./StockAdjustDialog";

/* ─── Config ─────────────────────────────────────────────────── */
const TYPE_CONFIG = {
  in: {
    label:  "মাল আসা",
    icon:   ArrowDown,
    badge:  "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-0",
    sign:   "+",
    color:  "text-emerald-600 dark:text-emerald-400",
  },
  out: {
    label:  "মাল যাওয়া",
    icon:   ArrowUp,
    badge:  "bg-rose-500/12 text-rose-700 dark:text-rose-400 border-0",
    sign:   "-",
    color:  "text-rose-600 dark:text-rose-400",
  },
  adjustment: {
    label:  "সংশোধন",
    icon:   RefreshCw,
    badge:  "bg-violet-500/12 text-violet-700 dark:text-violet-400 border-0",
    sign:   "=",
    color:  "text-violet-600 dark:text-violet-400",
  },
} as const;

/* ─── Props ──────────────────────────────────────────────────── */
interface StockHistoryDrawerProps {
  open:    boolean;
  item:    AdjustTarget | null;
  onClose: () => void;
}

/* ─── Component ──────────────────────────────────────────────── */
export function StockHistoryDrawer({ open, item, onClose }: StockHistoryDrawerProps) {
  const { formatDateTime } = useLocale();
  const { data: allAdjustments, isLoading } = useListInventoryAdjustments({
    query: { queryKey: getListInventoryAdjustmentsQueryKey(), enabled: open },
  });

  /* Filter to this product only */
  const history = (allAdjustments ?? []).filter(
    (a: { productId: number }) => a.productId === item?.id
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-base truncate">{item?.nameBn}</p>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                মজুদ ইতিহাস
              </p>
            </div>
          </SheetTitle>
          {/* Current stock pill */}
          {item && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground">বর্তমান মজুদ:</span>
              <Badge variant="secondary" className="text-xs tabular-nums">
                {item.stockQuantity} {item.unit}
              </Badge>
            </div>
          )}
        </SheetHeader>

        {/* History list */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Clock className="h-7 w-7 opacity-25" />
              </div>
              <p className="text-sm font-medium">কোনো ইতিহাস নেই</p>
              <p className="text-xs mt-1 opacity-60">
                মজুদ সমন্বয় করলে এখানে দেখা যাবে
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {history.map((adj: {
                id: number;
                type: string;
                quantity: number;
                reason?: string | null;
                createdAt: string;
              }) => {
                const cfg  = TYPE_CONFIG[adj.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.adjustment;
                const Icon = cfg.icon;
                return (
                  <div
                    key={adj.id}
                    className="flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors"
                  >
                    {/* Icon */}
                    <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${cfg.badge}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] h-4 px-1.5 ${cfg.badge}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      {adj.reason && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {adj.reason}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDateTime(adj.createdAt, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className={`text-right shrink-0 font-bold tabular-nums ${cfg.color}`}>
                      {cfg.sign}{adj.quantity}
                      <p className="text-[10px] text-muted-foreground font-normal">
                        {item?.unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
