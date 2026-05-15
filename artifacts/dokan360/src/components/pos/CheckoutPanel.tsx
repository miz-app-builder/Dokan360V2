import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Banknote,
  Smartphone,
  CreditCard,
  BookMinus,
  User,
  Check,
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import type { CartTotals } from "./useCart";

interface CustomerLike {
  id: number;
  name: string;
  phone?: string | null;
}

interface CheckoutPanelProps {
  totals:           CartTotals;
  isEmpty:          boolean;
  discount:         number;
  setDiscount:      (v: number) => void;
  paid:             number;
  setPaid:          (v: number) => void;
  paymentMethod:    string;
  setPaymentMethod: (v: string) => void;
  customers:        CustomerLike[];
  customerId:       string;
  setCustomerId:    (v: string) => void;
  onCheckout:       () => void;
  isProcessing:     boolean;
}

export function CheckoutPanel({
  totals, isEmpty, discount, setDiscount, paid, setPaid,
  paymentMethod, setPaymentMethod, customers, customerId,
  setCustomerId, onCheckout, isProcessing,
}: CheckoutPanelProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const [customerOpen, setCustomerOpen] = useState(false);
  const selectedCustomer = customers.find((c) => String(c.id) === customerId);

  const paymentMethods = [
    { value: "cash",   label: t("pos.cash"),   icon: Banknote },
    { value: "mobile", label: t("pos.mobile"), icon: Smartphone },
    { value: "card",   label: t("pos.card"),   icon: CreditCard },
    { value: "credit", label: t("pos.credit"), icon: BookMinus },
  ];

  const quickAmounts = Array.from(
    new Set(
      [totals.total, Math.ceil(totals.total / 50) * 50, 500, 1000, 2000]
        .filter((v) => v > 0),
    ),
  ).slice(0, 4);

  return (
    <div className="px-4 py-4 space-y-3.5 border-t border-border/60 bg-card shrink-0">

      {/* ── Customer combobox ── */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-semibold">{t("pos.customer")}</Label>
        <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center justify-between h-11 rounded-xl border border-input bg-background px-3 text-sm hover:bg-muted/40 transition-colors touch-manipulation">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`truncate ${!selectedCustomer ? "text-muted-foreground" : "font-medium"}`}>
                  {selectedCustomer ? selectedCustomer.name : t("pos.generalCustomer")}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start" side="top">
            <Command>
              <CommandInput placeholder={t("pos.searchCustomer")} className="h-10" />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>{t("pos.customerNotFound")}</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="__none__" onSelect={() => { setCustomerId(""); setCustomerOpen(false); }}>
                    <User className="h-4 w-4 mr-2 shrink-0" />
                    {t("pos.generalCustomer")}
                    {!customerId && <Check className="h-4 w-4 ml-auto text-primary" />}
                  </CommandItem>
                  {customers.map((c) => (
                    <CommandItem key={c.id} value={c.name} onSelect={() => { setCustomerId(String(c.id)); setCustomerOpen(false); }}>
                      <User className="h-4 w-4 mr-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{c.name}</p>
                        {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                      </div>
                      {customerId === String(c.id) && <Check className="h-4 w-4 ml-2 text-primary shrink-0" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Payment method — large tap targets ── */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-semibold">{t("pos.paymentMethod")}</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {paymentMethods.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setPaymentMethod(value)}
              className={[
                "flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-xs font-semibold border transition-all touch-manipulation",
                paymentMethod === value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03]"
                  : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Totals ── */}
      <div className="rounded-xl bg-muted/30 border border-border/50 p-3.5 space-y-2.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{t("pos.subtotal")}</span>
          <span className="tabular-nums font-semibold text-foreground">{formatCurrency(totals.subtotal)}</span>
        </div>

        {/* Discount */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground shrink-0 text-xs w-16">{t("pos.discount")}</span>
          <Input
            type="number"
            inputMode="numeric"
            className="h-10 text-right text-sm rounded-lg"
            value={discount || ""}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
            placeholder="০"
            min={0}
            max={totals.subtotal}
          />
        </div>

        {/* Total */}
        <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2.5">
          <span>{t("pos.total")}</span>
          <span className="tabular-nums text-primary">{formatCurrency(totals.total)}</span>
        </div>

        {/* Paid */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground shrink-0 text-xs w-16">{t("pos.paidAmount")}</span>
            <Input
              type="number"
              inputMode="numeric"
              className="h-10 text-right text-sm rounded-lg"
              value={paid || ""}
              onChange={(e) => setPaid(Math.max(0, Number(e.target.value)))}
              placeholder="০"
              min={0}
            />
          </div>

          {/* Quick-pay chips — larger touch area */}
          {totals.total > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setPaid(amt)}
                  className={[
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all touch-manipulation",
                    paid === amt
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border/60 hover:bg-muted/60 text-muted-foreground",
                  ].join(" ")}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          )}
        </div>

        {totals.due > 0 && (
          <div className="flex justify-between text-destructive font-bold border-t border-border/50 pt-2.5">
            <span>{t("pos.due")}</span>
            <span className="tabular-nums">{formatCurrency(totals.due)}</span>
          </div>
        )}
        {totals.change > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold border-t border-border/50 pt-2.5">
            <span>{t("pos.change")}</span>
            <span className="tabular-nums">{formatCurrency(totals.change)}</span>
          </div>
        )}
      </div>

      {/* ── Checkout button — large, thumb-friendly ── */}
      <Button
        className="w-full h-13 font-bold text-base gap-2 rounded-xl shadow-sm touch-manipulation"
        disabled={isEmpty || isProcessing}
        onClick={onCheckout}
      >
        <ShoppingBag className="h-5 w-5" />
        {isProcessing
          ? t("pos.processing")
          : t("pos.checkout", { amount: formatCurrency(totals.total) })}
      </Button>
    </div>
  );
}
