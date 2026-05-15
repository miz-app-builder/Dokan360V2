import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Package,
  Calculator,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────── */
export type AdjustType = "in" | "out" | "adjustment";

export interface AdjustTarget {
  id:            number;
  nameBn:        string;
  nameEn?:       string | null;
  stockQuantity: number;
  minStockLevel: number;
  unit:          string;
  categoryName?: string | null;
}

interface StockAdjustDialogProps {
  open:        boolean;
  item:        AdjustTarget | null;
  isPending:   boolean;
  onClose:     () => void;
  onSubmit:    (data: {
    productId: number;
    type:      AdjustType;
    quantity:  number;
    reason?:   string;
  }) => void;
}

/* ─── Type config ────────────────────────────────────────────── */
const TYPE_CONFIG = {
  in: {
    label:     "মাল আসা (Stock IN)",
    icon:      ArrowDown,
    accent:    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    active:    "bg-emerald-500 text-white border-emerald-500",
    hint:      "বর্তমান মজুদে যোগ হবে",
    presets:   [10, 25, 50, 100],
  },
  out: {
    label:     "মাল যাওয়া (Stock OUT)",
    icon:      ArrowUp,
    accent:    "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    active:    "bg-rose-500 text-white border-rose-500",
    hint:      "বর্তমান মজুদ থেকে বিয়োগ হবে",
    presets:   [5, 10, 20, 50],
  },
  adjustment: {
    label:     "সংশোধন (Adjustment)",
    icon:      RefreshCw,
    accent:    "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
    active:    "bg-violet-500 text-white border-violet-500",
    hint:      "সরাসরি নতুন মজুদ সংখ্যা নির্ধারণ",
    presets:   [],
  },
} as const;

/* ─── Component ──────────────────────────────────────────────── */
export function StockAdjustDialog({
  open,
  item,
  isPending,
  onClose,
  onSubmit,
}: StockAdjustDialogProps) {
  const [adjType, setAdjType]   = useState<AdjustType>("in");
  const [qty, setQty]           = useState("");
  const [reason, setReason]     = useState("");

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setAdjType("in");
      setQty("");
      setReason("");
    }
  }, [open]);

  if (!item) return null;

  const cfg       = TYPE_CONFIG[adjType];
  const qtyNum    = Number(qty);
  const isValid   = qty !== "" && qtyNum > 0;

  /* Preview: what will the new stock be? */
  const preview = (() => {
    if (!isValid) return null;
    if (adjType === "in")         return item.stockQuantity + qtyNum;
    if (adjType === "out")        return Math.max(0, item.stockQuantity - qtyNum);
    if (adjType === "adjustment") return qtyNum;
    return null;
  })();

  const previewDiff = preview !== null ? preview - item.stockQuantity : null;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      productId: item.id,
      type:      adjType,
      quantity:  qtyNum,
      reason:    reason.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            মজুদ সমন্বয়
          </DialogTitle>
          {/* Product info */}
          <div className="mt-2 p-3 rounded-lg bg-muted/40 border border-border/50">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{item.nameBn}</p>
                {item.nameEn && (
                  <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                )}
                {item.categoryName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.categoryName}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">বর্তমান</p>
                <p className="text-lg font-bold tabular-nums text-foreground leading-tight">
                  {item.stockQuantity}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ন্যূনতম: {item.minStockLevel} {item.unit}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">সমন্বয়ের ধরন</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["in", "out", "adjustment"] as AdjustType[]).map((t) => {
                const c   = TYPE_CONFIG[t];
                const Icon = c.icon;
                const active = adjType === t;
                return (
                  <button
                    key={t}
                    onClick={() => { setAdjType(t); setQty(""); }}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      active ? c.active : `${c.accent} hover:opacity-80`
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-center leading-tight">
                      {t === "in" ? "মাল আসা" : t === "out" ? "মাল যাওয়া" : "সংশোধন"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{cfg.hint}</p>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">
              {adjType === "adjustment" ? "নতুন মজুদ পরিমাণ" : "পরিমাণ"} ({item.unit})
            </Label>
            <Input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="০"
              min={0}
              className="h-10 text-right text-base font-bold tabular-nums"
              autoFocus
            />
            {/* Preset chips */}
            {cfg.presets.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {cfg.presets.map((v) => (
                  <button
                    key={v}
                    onClick={() => setQty(String(v))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      qty === String(v)
                        ? "bg-primary/12 border-primary/30 text-primary"
                        : "border-border/60 hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {preview !== null && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border/50 text-sm">
              <Calculator className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">নতুন মজুদ হবে:</span>
              <span className="font-bold tabular-nums ml-auto">
                {preview} {item.unit}
              </span>
              {previewDiff !== null && previewDiff !== 0 && (
                <Badge
                  className={`text-[10px] h-5 px-1.5 border-0 ${
                    previewDiff > 0
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {previewDiff > 0 ? "+" : ""}{previewDiff}
                </Badge>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">কারণ (ঐচ্ছিক)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="যেমন: নতুন মাল আসা, পণ্য নষ্ট হওয়া, ভুল গণনা সংশোধন..."
              className="resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="px-5 pb-5 gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            বাতিল
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            className="flex-1"
          >
            {isPending ? "আপডেট হচ্ছে..." : "সমন্বয় করুন"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
