import { createPortal } from "react-dom";
import { useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X, Maximize2 } from "lucide-react";
import { ThermalReceipt, type PrintSize } from "./ThermalReceipt";
import type { InvoiceSummary } from "./InvoiceModal";

interface ReceiptModalProps {
  open:    boolean;
  onClose: () => void;
  data:    InvoiceSummary;
  size:    PrintSize;
  onSizeChange: (s: PrintSize) => void;
}

export function ReceiptModal({ open, onClose, data, size, onSizeChange }: ReceiptModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* ── Print portal — only visible during window.print() ── */}
      {open && createPortal(
        <div id="receipt-print-area" ref={printAreaRef}>
          <ThermalReceipt data={data} size={size} />
        </div>,
        document.body,
      )}

      {/* ── Preview dialog ── */}
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="w-full max-w-md mx-auto p-0 gap-0 rounded-2xl overflow-hidden max-h-[92dvh] flex flex-col">
          <DialogTitle className="sr-only">রশিদ প্রিভিউ</DialogTitle>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">রশিদ প্রিভিউ</p>
                <p className="text-xs text-muted-foreground">{data.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Size selector */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0 bg-muted/30">
            <span className="text-xs text-muted-foreground font-medium">প্রিন্টার সাইজ:</span>
            <div className="flex gap-1">
              {(["58mm", "80mm"] as PrintSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onSizeChange(s)}
                  className={[
                    "px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors",
                    size === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted/50",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Maximize2 className="h-3 w-3" />
              <span>প্রিভিউ</span>
            </div>
          </div>

          {/* Receipt preview — scrollable */}
          <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-zinc-800 p-4 flex justify-center items-start">
            <div
              className="bg-white shadow-lg rounded-sm"
              style={{ border: "1px solid #ddd" }}
            >
              <ThermalReceipt data={data} size={size} />
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-border/60 shrink-0 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl font-semibold gap-2"
              onClick={onClose}
            >
              বন্ধ করুন
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              প্রিন্ট করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
