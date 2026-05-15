import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/hooks/useLocale";
import {
  useListCustomers,
  useCreateSale,
  useGetShop,
  getListSalesQueryKey,
  getGetDashboardSummaryQueryKey,
  getListProductsQueryKey,
  getListInventoryQueryKey,
  getGetShopQueryKey,
} from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package } from "lucide-react";
import { useCart }                           from "@/components/pos/useCart";
import { ProductGrid }                       from "@/components/pos/ProductGrid";
import { CartPanel }                         from "@/components/pos/CartPanel";
import { CheckoutPanel }                     from "@/components/pos/CheckoutPanel";
import { InvoiceModal, type InvoiceSummary } from "@/components/pos/InvoiceModal";
import { fadeIn } from "@/lib/motion";
import { useTranslation } from "react-i18next";

export default function POS() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const { toast } = useToast();
  const qc        = useQueryClient();
  const cart      = useCart();

  const [customerId, setCustomerId]         = useState("");
  const [invoice, setInvoice]               = useState<InvoiceSummary | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const { data: customers = [] } = useListCustomers();
  const { data: shop }           = useGetShop({ query: { queryKey: getGetShopQueryKey() } });
  const createSale               = useCreateSale();

  const handleCheckout = () => {
    if (cart.isEmpty) return;
    createSale.mutate(
      {
        data: {
          customerId:    customerId ? Number(customerId) : undefined,
          items:         cart.items.map((c) => ({
            productId: c.productId,
            quantity:  c.quantity,
            price:     c.price,
          })),
          discount:      cart.discount,
          paid:          cart.paid,
          paymentMethod: cart.paymentMethod as "cash" | "mobile" | "card" | "credit",
        },
      },
      {
        onSuccess: (res: {
          invoiceNumber: string;
          total: number | string;
          discount: number | string;
          paid: number | string;
          due: number | string;
        }) => {
          const customer    = customers.find((c: { id: number }) => String(c.id) === customerId);
          const snapItems   = cart.items.map((i) => ({
            nameBn:   i.nameBn,
            unit:     i.unit,
            quantity: i.quantity,
            price:    i.price,
            subtotal: +(i.price * i.quantity).toFixed(2),
          }));
          setInvoice({
            invoiceNumber: res.invoiceNumber,
            total:         Number(res.total),
            discount:      Number(res.discount),
            paid:          Number(res.paid),
            due:           Number(res.due),
            change:        Math.max(0, Number(res.paid) - Number(res.total)),
            itemCount:     cart.itemCount,
            paymentMethod: cart.paymentMethod,
            customerName:  (customer as { name?: string } | undefined)?.name,
            items:         snapItems,
            shopName:      shop?.name    ?? "",
            shopPhone:     shop?.phone   ?? null,
            shopAddress:   shop?.address ?? null,
            date:          new Date(),
          });
          cart.clear();
          setCustomerId("");
          setMobileCartOpen(false);
          qc.invalidateQueries({ queryKey: getListSalesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
          qc.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        },
        onError: () =>
          toast({
            variant:     "destructive",
            title:       t("pos.saleError"),
            description: t("pos.saleErrorDesc"),
          }),
      },
    );
  };

  const checkoutProps = {
    totals: cart.totals, isEmpty: cart.isEmpty,
    discount: cart.discount, setDiscount: cart.setDiscount,
    paid: cart.paid, setPaid: cart.setPaid,
    paymentMethod: cart.paymentMethod, setPaymentMethod: cart.setPaymentMethod,
    customers, customerId, setCustomerId,
    onCheckout: handleCheckout, isProcessing: createSale.isPending,
  };
  const cartProps = {
    items: cart.items,
    onUpdateQty: cart.updateQty,
    onRemove: cart.removeItem,
    onClear: cart.clear,
  };

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="flex flex-col lg:flex-row gap-4 h-[calc(100dvh-7rem)]"
      >
        {/* ═══ LEFT — Product section ═══════════════════════════ */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">

          {/* Mobile/Tablet cart trigger */}
          <div className="flex justify-end mb-3 shrink-0 lg:hidden">
            {/* Mobile/Tablet cart trigger — shown below lg */}
            <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
              <SheetTrigger asChild>
                <button className="relative lg:hidden flex items-center gap-2 h-11 px-4 rounded-xl border border-border/70 bg-card hover:bg-muted/50 transition-colors touch-manipulation font-semibold text-sm">
                  <ShoppingCart className="h-4.5 w-4.5" />
                  <span className="hidden sm:inline">{t("pos.cart")}</span>
                  <AnimatePresence>
                    {!cart.isEmpty && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center absolute -top-1.5 -right-1.5 shadow-md"
                      >
                        {cart.itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </SheetTrigger>

              {/* Mobile cart sheet — full width on phones, 420px on tablets */}
              <SheetContent
                side="right"
                className="w-full sm:w-[420px] p-0 flex flex-col overflow-hidden"
              >
                <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                  <CartPanel {...cartProps} />
                </div>
                <CheckoutPanel {...checkoutProps} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Product grid */}
          <div className="flex-1 min-h-0">
            <ProductGrid onAddProduct={cart.addItem} />
          </div>
        </div>

        {/* ═══ RIGHT — Cart + Checkout panel (desktop lg+) ═════ */}
        <div className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 flex-col border border-border/60 rounded-2xl bg-card overflow-hidden shadow-sm">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <CartPanel {...cartProps} />
          </div>
          <CheckoutPanel {...checkoutProps} />
        </div>
      </motion.div>

      {/* Floating cart FAB — only on very small phones when sheet is closed */}
      <AnimatePresence>
        {!cart.isEmpty && !mobileCartOpen && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setMobileCartOpen(true)}
            className="fixed bottom-20 right-4 z-40 lg:hidden flex items-center gap-2.5 h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 font-bold text-sm touch-manipulation"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{formatCurrency(cart.totals.total)}</span>
            <Badge className="h-5 min-w-5 px-1 text-[10px] font-bold bg-white text-primary rounded-full">
              {cart.itemCount}
            </Badge>
          </motion.button>
        )}
      </AnimatePresence>

      <InvoiceModal
        invoice={invoice}
        onClose={() => setInvoice(null)}
        onNewSale={() => setInvoice(null)}
      />
    </>
  );
}
