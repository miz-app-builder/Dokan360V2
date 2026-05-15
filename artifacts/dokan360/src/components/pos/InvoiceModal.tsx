import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import { ReceiptModal } from "./ReceiptModal";
import type { PrintSize } from "./ThermalReceipt";
import { usePrinterSettings } from "@/hooks/use-printer-settings";

export interface ReceiptItem {
  nameBn:   string;
  unit:     string;
  quantity: number;
  price:    number;
  subtotal: number;
}

export interface InvoiceSummary {
  invoiceNumber:  string;
  total:          number;
  discount:       number;
  paid:           number;
  due:            number;
  change:         number;
  itemCount:      number;
  paymentMethod:  string;
  customerName?:  string;
  /* Receipt data */
  items:          ReceiptItem[];
  shopName:       string;
  shopPhone?:     string | null;
  shopAddress?:   string | null;
  date:           Date;
}

interface InvoiceModalProps {
  invoice:   InvoiceSummary | null;
  onClose:   () => void;
  onNewSale: () => void;
}

export function InvoiceModal({ invoice, onClose, onNewSale }: InvoiceModalProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const { settings: printerSettings } = usePrinterSettings();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [printSize,   setPrintSize]   = useState<PrintSize>(printerSettings.paperSize);

  const paymentLabels: Record<string, string> = {
    cash:   t("pos.cash"),
    mobile: t("pos.mobileBanking"),
    card:   t("pos.card"),
    credit: t("pos.creditLabel"),
  };

  function handleClose() {
    setReceiptOpen(false);
    onClose();
  }

  function handleNewSale() {
    setReceiptOpen(false);
    onNewSale();
  }

  return (
    <>
      <Dialog open={!!invoice && !receiptOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="w-full max-w-sm mx-auto p-0 overflow-hidden gap-0 rounded-2xl sm:rounded-2xl">
          <DialogTitle className="sr-only">{t("pos.saleComplete")}</DialogTitle>
          {invoice && (
            <>
              {/* Success header */}
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-6 text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{t("pos.saleComplete")}</h3>
                <p className="text-sm text-muted-foreground mt-1 font-mono">{invoice.invoiceNumber}</p>
              </div>

              {/* Details */}
              <div className="p-5 space-y-4">
                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-3 text-sm">
                  {invoice.customerName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("pos.customer")}</span>
                      <span className="font-semibold">{invoice.customerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pos.itemCount")}</span>
                    <span className="font-semibold">{t("pos.items", { count: invoice.itemCount })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pos.payment")}</span>
                    <span className="font-semibold">{paymentLabels[invoice.paymentMethod] ?? invoice.paymentMethod}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("pos.discount")}</span>
                      <span>{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border/50 pt-3">
                    <span>{t("pos.total")}</span>
                    <span className="text-primary tabular-nums">{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("pos.paidAmount")}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(invoice.paid)}</span>
                  </div>
                  {invoice.due > 0 && (
                    <div className="flex justify-between text-destructive font-bold">
                      <span>{t("pos.due")}</span>
                      <span className="tabular-nums">{formatCurrency(invoice.due)}</span>
                    </div>
                  )}
                  {invoice.change > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>{t("pos.change")}</span>
                      <span className="tabular-nums">{formatCurrency(invoice.change)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 h-12 rounded-xl font-semibold touch-manipulation"
                    onClick={() => setReceiptOpen(true)}
                  >
                    <Printer className="h-4 w-4" />
                    {t("pos.print")}
                  </Button>
                  <Button
                    className="flex-1 gap-2 h-12 rounded-xl font-semibold touch-manipulation"
                    onClick={handleNewSale}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("pos.newSale")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt print preview modal */}
      {invoice && receiptOpen && (
        <ReceiptModal
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          data={invoice}
          size={printSize}
          onSizeChange={setPrintSize}
        />
      )}
    </>
  );
}
