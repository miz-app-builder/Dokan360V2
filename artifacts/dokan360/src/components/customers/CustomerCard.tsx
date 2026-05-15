import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import type { Customer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Edit2,
  MoreVertical,
  Phone,
  MapPin,
  Trash2,
  Wallet,
  TrendingUp,
} from "lucide-react";

interface Props {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onLedger: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  isDeleting: boolean;
}

export function CustomerCard({
  customer,
  onEdit,
  onLedger,
  onPayment,
  onDelete,
  isDeleting,
}: Props) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const balance = Number(customer.balance);
  const totalPurchase = Number(customer.totalPurchase);
  const due = Math.abs(Math.min(balance, 0));
  const hasDue = balance < 0;

  const initials = customer.name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{customer.name}</p>
            {customer.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{customer.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasDue && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              {t("customers.dueBalance")} {formatCurrency(due)}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(customer)} className="gap-2 cursor-pointer">
                <Edit2 className="h-3.5 w-3.5" />
                {t("customers.editMenu")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onLedger(customer)} className="gap-2 cursor-pointer">
                <BookOpen className="h-3.5 w-3.5" />
                {t("customers.ledgerMenu")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPayment(customer)} className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600">
                <Wallet className="h-3.5 w-3.5" />
                {t("customers.collectPaymentMenu")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("customers.deleteMenu")}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("customers.deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{customer.name}</strong> — {t("customers.deleteDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(customer)}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting ? t("customers.deleting") : t("customers.deleteMenu")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Address */}
      {customer.address && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="line-clamp-1">{customer.address}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("customers.totalPurchaseLabel")}</p>
          </div>
          <p className="text-sm font-bold tabular-nums">
            {formatCurrency(totalPurchase)}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 px-2.5 py-2">
          <div className="flex items-center gap-1 mb-0.5">
            <Wallet className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("customers.balanceLabel")}</p>
          </div>
          <p
            className={`text-sm font-bold tabular-nums ${
              balance < 0 ? "text-destructive" : "text-emerald-600"
            }`}
          >
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 gap-1.5 text-xs"
          onClick={() => onLedger(customer)}
        >
          <BookOpen className="h-3.5 w-3.5" />
          {t("customers.ledgerBtn")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 gap-1.5 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          onClick={() => onPayment(customer)}
        >
          <Wallet className="h-3.5 w-3.5" />
          {t("customers.paymentBtn")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs px-2.5"
          onClick={() => onEdit(customer)}
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
