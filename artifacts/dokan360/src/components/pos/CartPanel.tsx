import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import type { CartItem } from "./useCart";

interface CartPanelProps {
  items:       CartItem[];
  onUpdateQty: (productId: number, qty: number) => void;
  onRemove:    (productId: number) => void;
  onClear:     () => void;
}

export function CartPanel({ items, onUpdateQty, onRemove, onClear }: CartPanelProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const totalItems = items.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4.5 w-4.5 text-muted-foreground" />
          <h2 className="font-semibold text-sm">{t("pos.cart")}</h2>
          {totalItems > 0 && (
            <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
              {totalItems}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors py-1 px-2 rounded-lg hover:bg-destructive/8 touch-manipulation"
          >
            <X className="h-3.5 w-3.5" />
            {t("pos.clearCart")}
          </button>
        )}
      </div>

      {/* Items list */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <ShoppingCart className="h-7 w-7 opacity-25" />
            </div>
            <p className="text-sm font-medium">{t("pos.emptyCart")}</p>
            <p className="text-xs mt-1 opacity-60">{t("pos.emptyCartDesc")}</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40"
              >
                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">{item.nameBn}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-primary tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {item.quantity} × {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>

                {/* Qty controls — 44px touch targets */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                    className="h-10 w-10 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted active:scale-90 transition-all touch-manipulation"
                    aria-label="decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>

                  <span className="text-sm font-bold w-8 text-center tabular-nums select-none">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                    className="h-10 w-10 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                    aria-label="increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => onRemove(item.productId)}
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-90 transition-all touch-manipulation"
                    aria-label="remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
