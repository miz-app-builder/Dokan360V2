import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer, Eye } from "lucide-react";
import { BarcodeLabel, LABEL_SIZES, type LabelSize, type BarcodeLabelProduct } from "./BarcodeLabel";

/* ─── Props ──────────────────────────────────────────────────── */
interface BarcodePrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: BarcodeLabelProduct[];
}

/* ─── Component ──────────────────────────────────────────────── */
export function BarcodePrintDialog({ open, onOpenChange, products }: BarcodePrintDialogProps) {
  const { t } = useTranslation();
  const [size, setSize]       = useState<LabelSize>("md");
  const [copies, setCopies]   = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  /* ── Expand products by copies ── */
  const labels: BarcodeLabelProduct[] = [];
  for (const p of products) {
    for (let i = 0; i < copies; i++) labels.push(p);
  }

  /* ── Print handler ── */
  const handlePrint = () => {
    const area = document.getElementById("barcode-print-area");
    if (!area) return;
    window.print();
  };

  const copiesVal = Math.max(1, Math.min(50, copies));
  const totalLabels = products.length * copiesVal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="h-4 w-4 text-primary" />
            {t("barcode.printTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2">
          {/* ── Options ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-muted/40 rounded-xl p-4">
            {/* Label size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("barcode.labelSize")}</Label>
              <Select value={size} onValueChange={(v) => setSize(v as LabelSize)}>
                <SelectTrigger className="h-9 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {(Object.entries(LABEL_SIZES) as [LabelSize, typeof LABEL_SIZES[LabelSize]][]).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-sm">{cfg.labelBn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Copies */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("barcode.copiesPerLabel")}</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="h-9 rounded-xl text-sm"
              />
            </div>

            {/* Show price toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t("barcode.showPrice")}</Label>
              <Select value={showPrice ? "yes" : "no"} onValueChange={(v) => setShowPrice(v === "yes")}>
                <SelectTrigger className="h-9 rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="yes">{t("common.yes")}</SelectItem>
                  <SelectItem value="no">{t("common.no")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Eye className="h-3.5 w-3.5" />
            {t("barcode.labelCount", { count: totalLabels })} · {products.length} {t("barcode.products")} × {copiesVal} {t("barcode.copies")}
          </div>

          {/* ── Preview grid (also the print area) ── */}
          <div id="barcode-print-area" ref={printRef}>
            <div
              className="barcode-label-sheet grid gap-2 p-3 bg-white border border-border/50 rounded-xl"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${LABEL_SIZES[size].widthPx}px, max-content))`,
              }}
            >
              {labels.map((p, i) => (
                <BarcodeLabel key={`${p.id}-${i}`} product={p} size={size} showPrice={showPrice} />
              ))}
              {labels.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
                  {t("barcode.noProducts")}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={labels.length === 0}
            className="gap-2 rounded-xl shadow-md shadow-primary/20"
          >
            <Printer className="h-4 w-4" />
            {t("barcode.printBtn")} ({totalLabels})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
