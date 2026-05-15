import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import type { Customer } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

interface Props {
  customer: Customer;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => void;
  isPending: boolean;
}

export function CustomerPaymentDialog({
  customer,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const { formatCurrency } = useLocale();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const due = Math.abs(Math.min(Number(customer.balance), 0));
  const parsedAmount = Number(amount);
  const isValid = parsedAmount > 0 && !isNaN(parsedAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(parsedAmount, note.trim() || "নগদ পরিশোধ");
  };

  const fillDue = () => {
    if (due > 0) setAmount(String(due));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            পরিশোধ গ্রহণ
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mb-1">
          <p className="font-semibold text-base">{customer.name}</p>
          {customer.phone && (
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          )}
          {due > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-sm px-2.5 py-0.5">
                বাকি: {formatCurrency(due)}
              </Badge>
              <button
                type="button"
                onClick={fillDue}
                className="text-xs text-primary underline underline-offset-2 hover:no-underline"
              >
                সম্পূর্ণ বাকি পূরণ করুন
              </button>
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 mt-2"
            >
              বাকি নেই
            </Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">
              পরিমাণ (৳) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="০.০০"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">নোট</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="নগদ পরিশোধ"
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? "সংরক্ষণ হচ্ছে..." : "পরিশোধ নিন"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
