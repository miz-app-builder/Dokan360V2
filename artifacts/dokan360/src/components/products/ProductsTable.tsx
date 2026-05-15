import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Trash2, Package, AlertTriangle, Barcode, Printer } from "lucide-react";
import type { Product } from "@workspace/api-client-react";
import { BarcodePrintDialog } from "@/components/barcode/BarcodePrintDialog";

/* ─── Helpers ────────────────────────────────────────────────── */
const PALETTE = [
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
];

function ProductAvatar({ name, categoryName }: { name: string; categoryName?: string | null }) {
  const seed = (categoryName ?? name).charCodeAt(0) % PALETTE.length;
  return (
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${PALETTE[seed]}`}>
      {name.charAt(0)}
    </div>
  );
}

function StockBadge({ qty, min }: { qty: number; min: number }) {
  const { t } = useTranslation();
  if (qty === 0)
    return (
      <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-1">
        <AlertTriangle className="h-2.5 w-2.5" />{t("products.outOfStock")}
      </Badge>
    );
  if (qty <= min)
    return (
      <Badge className="text-[10px] h-5 px-1.5 gap-1 bg-orange-500/15 text-orange-700 dark:text-orange-300 border-0">
        <AlertTriangle className="h-2.5 w-2.5" />{t("products.lowStockBadge")}
      </Badge>
    );
  return <span className="text-sm tabular-nums font-semibold">{qty}</span>;
}

/* ─── Props ──────────────────────────────────────────────────── */
interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  deleteId: number | null;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

/* ─── Component ──────────────────────────────────────────────── */
export function ProductsTable({
  products, isLoading, onEdit, onDelete,
  isDeleting, deleteId, onDeleteConfirm, onDeleteCancel,
}: ProductsTableProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const [printProduct, setPrintProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">

        {/* ── Loading skeletons ── */}
        {isLoading && (
          <div className="divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* ── Mobile card list (< sm) ── */}
        {!isLoading && products.length > 0 && (
          <div className="sm:hidden divide-y divide-border/40">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                <ProductAvatar name={p.nameBn} categoryName={p.categoryName} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.nameBn}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-bold text-primary text-sm tabular-nums">
                      {formatCurrency(p.price)}
                    </span>
                    <StockBadge qty={p.stockQuantity} min={p.minStockLevel} />
                    {p.categoryName && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                        {p.categoryName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 rounded-xl touch-manipulation"
                    onClick={() => onEdit(p)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-10 w-10 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                    onClick={() => onDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Desktop/Tablet table (sm+) ── */}
        {!isLoading && products.length > 0 && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("inventory.product")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t("common.category")}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("products.barcode")} / SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("products.price")}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("products.stockBadge")}</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t("common.status")}</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductAvatar name={p.nameBn} categoryName={p.categoryName} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[180px]">{p.nameBn}</p>
                          {p.nameEn && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{p.nameEn}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.categoryName
                        ? <Badge variant="secondary" className="text-xs font-normal">{p.categoryName}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="space-y-0.5">
                        {p.barcode && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Barcode className="h-3 w-3" />
                            <span className="font-mono">{p.barcode}</span>
                          </div>
                        )}
                        {p.sku && <p className="text-xs text-muted-foreground font-mono">SKU: {p.sku}</p>}
                        {!p.barcode && !p.sku && <span className="text-muted-foreground text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-primary tabular-nums">{formatCurrency(p.price)}</p>
                      {p.costPrice != null && (
                        <p className="text-xs text-muted-foreground tabular-nums">{t("products.costBuy")} {formatCurrency(p.costPrice)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <StockBadge qty={p.stockQuantity} min={p.minStockLevel} />
                        <span className="text-xs text-muted-foreground">{p.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {p.isActive
                        ? <Badge className="text-[10px] h-5 px-2 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-0">{t("common.active")}</Badge>
                        : <Badge variant="secondary" className="text-[10px] h-5 px-2">{t("common.inactive")}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintProduct(p)}>
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("barcode.printLabel")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}>
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.edit")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("common.delete")}</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
              <Package className="h-7 w-7 opacity-40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t("products.noProductsFound")}</p>
              <p className="text-xs mt-0.5">{t("products.tryDifferentSearch")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && onDeleteCancel()}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("products.deleteProduct")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("products.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={onDeleteCancel} className="h-11 rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="h-11 rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={onDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t("products.deactivating") : t("products.deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode print dialog (single product) */}
      {printProduct && (
        <BarcodePrintDialog
          open={!!printProduct}
          onOpenChange={(o) => { if (!o) setPrintProduct(null); }}
          products={[printProduct]}
        />
      )}
    </>
  );
}
