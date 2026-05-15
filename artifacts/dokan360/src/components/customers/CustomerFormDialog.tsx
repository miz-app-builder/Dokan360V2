import { useEffect, useState } from "react";
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

export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const EMPTY: CustomerFormValues = { name: "", phone: "", email: "", address: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCustomer: Customer | null;
  onSubmit: (values: CustomerFormValues, isEdit: boolean) => void;
  isPending: boolean;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  editCustomer,
  onSubmit,
  isPending,
}: Props) {
  const [form, setForm] = useState<CustomerFormValues>(EMPTY);

  useEffect(() => {
    if (editCustomer) {
      setForm({
        name: editCustomer.name,
        phone: editCustomer.phone ?? "",
        email: editCustomer.email ?? "",
        address: editCustomer.address ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [editCustomer, open]);

  const f = (k: keyof CustomerFormValues, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, !!editCustomer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editCustomer ? "গ্রাহক সম্পাদনা" : "নতুন গ্রাহক যোগ করুন"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              নাম <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => f("name", e.target.value)}
              placeholder="গ্রাহকের নাম"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">ফোন নম্বর</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => f("phone", e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">ইমেইল</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => f("email", e.target.value)}
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">ঠিকানা</Label>
            <Textarea
              id="address"
              value={form.address}
              onChange={(e) => f("address", e.target.value)}
              placeholder="গ্রাহকের ঠিকানা"
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              বাতিল
            </Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending
                ? "সংরক্ষণ হচ্ছে..."
                : editCustomer
                  ? "আপডেট করুন"
                  : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
