import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSuppliers,
  useGetSupplierStats,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  getListSuppliersQueryKey,
  getGetSupplierStatsQueryKey,
} from "@workspace/api-client-react";
import { fadeInUp } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Truck, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, TrendingUp, AlertCircle } from "lucide-react";

type Supplier = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  balance: number;
  totalPurchase: number;
};

type SupplierForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

const EMPTY_FORM: SupplierForm = { name: "", phone: "", email: "", address: "" };

function SupplierDialog({
  open,
  onClose,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<SupplierForm>(
    supplier
      ? { name: supplier.name, phone: supplier.phone ?? "", email: supplier.email ?? "", address: supplier.address ?? "" }
      : EMPTY_FORM,
  );

  const { mutate: create, isPending: creating } = useCreateSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSupplierStatsQueryKey() });
        toast({ title: t("suppliers.created") });
        onClose();
      },
      onError: () => toast({ title: t("suppliers.createFailed"), variant: "destructive" }),
    },
  });

  const { mutate: update, isPending: updating } = useUpdateSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        toast({ title: t("suppliers.updated") });
        onClose();
      },
      onError: () => toast({ title: t("suppliers.updateFailed"), variant: "destructive" }),
    },
  });

  const isPending = creating || updating;

  function handleSave() {
    if (!form.name.trim()) {
      toast({ title: t("suppliers.nameRequired"), variant: "destructive" });
      return;
    }
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
    };
    if (supplier) {
      update({ id: supplier.id, data });
    } else {
      create({ data });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? t("suppliers.edit") : t("suppliers.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm">{t("suppliers.name")} *</Label>
            <Input className="h-10 rounded-xl" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("suppliers.namePlaceholder")} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("common.phone")}</Label>
            <Input className="h-10 rounded-xl" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("common.email")}</Label>
            <Input className="h-10 rounded-xl" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="example@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t("common.address")}</Label>
            <Input className="h-10 rounded-xl" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder={t("suppliers.addressPlaceholder")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>{t("common.cancel")}</Button>
          <Button className="rounded-xl gap-2" onClick={handleSave} disabled={isPending}>
            {isPending ? t("common.loading") : (supplier ? t("common.save") : t("suppliers.addBtn"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SuppliersPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useListSuppliers(
    { search: search || undefined },
    { query: { queryKey: getListSuppliersQueryKey({ search: search || undefined }) } },
  );

  const { data: stats } = useGetSupplierStats({
    query: { queryKey: getGetSupplierStatsQueryKey() },
  });

  const { mutate: deleteSupplier } = useDeleteSupplier({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSupplierStatsQueryKey() });
        toast({ title: t("suppliers.deleted") });
      },
      onError: () => toast({ title: t("suppliers.deleteFailed"), variant: "destructive" }),
    },
  });

  const items = (suppliers as Supplier[] | undefined) ?? [];

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-end">
        <Button className="rounded-xl gap-2 h-9" onClick={() => { setEditSupplier(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />{t("suppliers.addBtn")}
        </Button>
      </motion.div>

      {stats && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
        >
          {[
            { label: t("suppliers.totalSuppliers"), value: stats.totalSuppliers, icon: Truck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
            { label: t("suppliers.totalPurchase"), value: formatCurrency(stats.totalPurchase), icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
            { label: t("suppliers.totalDue"), value: formatCurrency(stats.totalDue), icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/15" },
          ].map((s) => (
            <Card key={s.label} className="border-border/60 shadow-sm rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${s.bg}`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 rounded-xl border-border/70"
            placeholder={t("suppliers.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Truck className="h-10 w-10 opacity-20" />
            <p className="text-sm">{t("suppliers.noSuppliers")}</p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((s) => (
              <Card key={s.id} className="border-border/60 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 font-bold text-sm">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {s.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{s.phone}</span>}
                          {s.email && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{s.email}</span>}
                          {s.address && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{s.address}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/60"
                          onClick={() => { setEditSupplier(s); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("suppliers.deleteConfirmTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("suppliers.deleteConfirmDesc")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteSupplier({ id: s.id })}>
                                {t("common.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground">{t("suppliers.totalPurchase")}:</span>{" "}
                        <span className="font-semibold">{formatCurrency(s.totalPurchase)}</span>
                      </div>
                      {s.balance < 0 && (
                        <Badge className="h-5 px-2 text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-0">
                          {t("suppliers.due")}: {formatCurrency(Math.abs(s.balance))}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <SupplierDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditSupplier(null); }}
        supplier={editSupplier}
      />
    </div>
  );
}
