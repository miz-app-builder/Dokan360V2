import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useListProducts, type Product } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, AlertTriangle, ScanLine, Camera } from "lucide-react";
import { CameraScanner } from "@/components/barcode/CameraScanner";

const AVATAR_COLORS = [
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
];

interface ProductLike {
  id: number;
  nameBn: string;
  unit: string;
  price: number | string;
  stockQuantity: number;
}

interface ProductGridProps {
  onAddProduct: (product: ProductLike) => void;
}

export function ProductGrid({ onAddProduct }: ProductGridProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const [search, setSearch]             = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState(false);
  const [cameraOpen, setCameraOpen]     = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useListProducts({
    search: search || undefined,
  });

  const handleBarcodeKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      const code = barcodeInput.trim();
      if (!code) return;
      const found = (products ?? []).find(
        (p: Product) => p.barcode === code || p.sku === code,
      );
      if (found && found.isActive && found.stockQuantity > 0) {
        onAddProduct(found);
        setBarcodeInput("");
        setBarcodeError(false);
      } else {
        setBarcodeError(true);
        setTimeout(() => setBarcodeError(false), 1200);
      }
    },
    [barcodeInput, products, onAddProduct],
  );

  const handleCameraScan = useCallback(
    (code: string) => {
      const found = (products ?? []).find(
        (p: Product) => p.barcode === code || p.sku === code,
      );
      if (found && found.isActive && found.stockQuantity > 0) {
        onAddProduct(found);
      } else {
        setBarcodeError(true);
        setTimeout(() => setBarcodeError(false), 1200);
      }
    },
    [products, onAddProduct],
  );

  const activeProducts = (products ?? []).filter((p: Product) => p.isActive);

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* ── Search + Barcode ── */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 h-11 text-base rounded-xl"
            placeholder={t("pos.searchProduct")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
        {/* Barcode input — visible on sm+ only */}
        <div className="relative w-36 shrink-0 hidden sm:block">
          <ScanLine
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${
              barcodeError ? "text-destructive" : "text-muted-foreground"
            }`}
          />
          <Input
            ref={barcodeRef}
            className={`pl-9 h-11 font-mono text-sm rounded-xl transition-colors ${
              barcodeError ? "border-destructive ring-1 ring-destructive/30" : ""
            }`}
            placeholder={t("pos.barcode")}
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKey}
            autoComplete="off"
          />
        </div>
        {/* Camera scan button */}
        <Button
          variant="outline"
          size="icon"
          className={`h-11 w-11 rounded-xl shrink-0 transition-colors ${
            barcodeError ? "border-destructive text-destructive" : "border-border/70"
          }`}
          onClick={() => setCameraOpen(true)}
          title={t("barcode.cameraScanner")}
        >
          <Camera className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Camera scanner modal */}
      <CameraScanner
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onScan={handleCameraScan}
        title={t("barcode.cameraScannerTitle")}
      />

      {/* ── Product Grid ── */}
      <ScrollArea className="flex-1 rounded-xl border border-border/60 bg-card/30">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 p-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[96px] rounded-xl" />
            ))}
          </div>
        ) : activeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <ShoppingBag className="h-7 w-7 opacity-25" />
            </div>
            <p className="text-sm font-medium">{t("pos.noProducts")}</p>
            {search && <p className="text-xs mt-1">{t("pos.changeSearch", { term: search })}</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 p-2.5">
            {activeProducts.map((p: Product) => {
              const colorIdx =
                (p.categoryName ?? p.nameBn).charCodeAt(0) % AVATAR_COLORS.length;
              const isOutOfStock = p.stockQuantity === 0;
              const isLowStock   = !isOutOfStock && p.stockQuantity <= p.minStockLevel;

              return (
                <button
                  key={p.id}
                  onClick={() => !isOutOfStock && onAddProduct(p)}
                  disabled={isOutOfStock}
                  style={{ minHeight: 88 }}
                  className={[
                    "group relative text-left p-3 rounded-xl border transition-all select-none touch-manipulation",
                    isOutOfStock
                      ? "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed"
                      : "border-border/60 bg-card hover:bg-primary/5 hover:border-primary/30 hover:shadow-md cursor-pointer active:scale-[0.94] active:bg-primary/8",
                  ].join(" ")}
                >
                  {/* Avatar */}
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold mb-2 shrink-0 ${AVATAR_COLORS[colorIdx]}`}>
                    {p.nameBn.charAt(0)}
                  </div>

                  {/* Name */}
                  <p className="font-semibold text-[13px] leading-tight line-clamp-2 mb-1.5">
                    {p.nameBn}
                  </p>

                  {/* Price + Stock */}
                  <div className="flex items-center justify-between gap-1 mt-auto">
                    <span className="text-primary font-extrabold text-[15px] leading-none tabular-nums">
                      {formatCurrency(p.price)}
                    </span>
                    <span className={`text-[10px] font-semibold leading-none tabular-nums ${
                      isLowStock ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground"
                    }`}>
                      {isLowStock && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
                      {p.stockQuantity}
                    </span>
                  </div>

                  {isOutOfStock && (
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                      <Badge variant="secondary" className="text-[10px] shadow-sm">{t("pos.outOfStock")}</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
