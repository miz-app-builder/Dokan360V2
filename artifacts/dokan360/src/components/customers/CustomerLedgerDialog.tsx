import { useLocale } from "@/hooks/useLocale";
import type { Customer, LedgerEntry } from "@workspace/api-client-react";
import { useGetCustomerLedger } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  BookOpen,
} from "lucide-react";

interface Props {
  customer: Customer;
  onClose: () => void;
  onCollectPayment: () => void;
}

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const { formatCurrency, formatDateTime } = useLocale();
  const isSale = entry.type === "sale";
  const isPayment = entry.type === "payment";

  const typeLabel = isSale ? "বিক্রয়" : isPayment ? "পরিশোধ" : entry.type;
  const icon = isSale ? (
    <ArrowUpRight className="h-3.5 w-3.5 text-destructive shrink-0" />
  ) : (
    <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
  );

  const amountColor = isSale ? "text-destructive" : "text-emerald-600";
  const amountPrefix = isSale ? "+" : "-";

  const dateTimeStr = formatDateTime(entry.createdAt, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-between py-3 gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{typeLabel}</p>
          {entry.note && (
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
              {entry.note}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {dateTimeStr}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold tabular-nums ${amountColor}`}>
          {amountPrefix}{formatCurrency(entry.amount)}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          ব্যাল: {formatCurrency(entry.balance)}
        </p>
      </div>
    </div>
  );
}

export function CustomerLedgerDialog({ customer, onClose, onCollectPayment }: Props) {
  const { formatCurrency, formatDateTime } = useLocale();
  const { data: ledger, isLoading } = useGetCustomerLedger(customer.id);
  const entries: LedgerEntry[] = ledger ?? [];
  const due = Math.abs(Math.min(Number(customer.balance), 0));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            হিসাব খাতা
          </DialogTitle>
        </DialogHeader>

        {/* Customer summary */}
        <div className="rounded-lg bg-muted/50 border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{customer.name}</p>
              {customer.phone && (
                <p className="text-xs text-muted-foreground">{customer.phone}</p>
              )}
            </div>
            {due > 0 ? (
              <Badge variant="destructive" className="text-xs">
                বাকি {formatCurrency(due)}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-xs"
              >
                বাকি নেই
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="text-xs text-muted-foreground">মোট ক্রয়</p>
              <p className="text-sm font-bold tabular-nums">
                {formatCurrency(customer.totalPurchase)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">বর্তমান ব্যালেন্স</p>
              <p
                className={`text-sm font-bold tabular-nums ${
                  Number(customer.balance) < 0
                    ? "text-destructive"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(customer.balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Collect payment button */}
        <Button
          onClick={onCollectPayment}
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          size="sm"
        >
          <Wallet className="h-4 w-4" />
          পরিশোধ গ্রহণ করুন
        </Button>

        <Separator />

        {/* Ledger entries */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            লেনদেনের ইতিহাস
          </p>
          <ScrollArea className="max-h-72">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                <BookOpen className="h-8 w-8 opacity-30" />
                <p className="text-sm">কোনো লেনদেন নেই</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {entries.map((e) => (
                  <LedgerRow key={e.id} entry={e} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
