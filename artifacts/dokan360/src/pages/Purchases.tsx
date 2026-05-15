import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPurchases,
  useGetPurchaseStats,
  useListSuppliers,
  useListProducts,
  useCreatePurchase,
  useGetPurchase,
  useDeletePurchase,
  usePayPurchaseDue,
  getListPurchasesQueryKey,
  getGetPurchaseStatsQueryKey,
  getListSuppliersQueryKey,
  getGetPurchaseQueryKey,
} from "@workspace/api-client-react";
import { fadeInUp } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Plus, Trash2, Eye, TrendingUp, AlertCircle, DollarSign, CheckCircle, MinusCircle, PackagePlus } from "lucide-react";

type Purchase = {
  id: number;
  invoiceNumber: string;
  supplierId?: number | null;
  supplierName?: string | null;
  total: number;
  paid: number;
  due: number;
  status: string;
  itemCount: number;
  note?: string | null;
  purchasedAt: string;
};

type PurchaseItem = {
  productId?: number | null;
  productNameBn: string;
  quantity: number;
  costPrice: number;
};

const STATUS_COLORS: Record<string, string> = {
  received:  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending:   "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  received:  "প্রাপ্ত",
  pending:   "মুলতবি",
  cancelled: "বাতিল",
};

function PurchaseDetailDialog({ id, open, onClose }: { id: number; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocale();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [payAmount, setPayAmount] = useState("");
  const [showPay, setShowPay] = useState(false);

  const { data: purchase } = useGetPurchase(id, {
    query: { queryKey: getGetPurchaseQueryKey(id), enabled: open && id > 0 },
  }) as { data: (Purchase & { items: PurchaseItem[] }) | undefined };

  const { mutate: payDue, isPending: paying } = usePayPurchaseDue({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPurchaseStatsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPurchaseQueryKey(id) });
        toast({ title: t("purchases.paySuccess") });
        setPayAmount("");
        setShowPay(false);
      },
      onError: () => toast({ title: t("purchases.payFailed"), variant: "destructive" }),
    },
  });

  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            {purchase.invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {purchase.supplierName && (
              <div><span className="text-muted-foreground">{t("purchases.supplier")}:</span> <span className="font-medium">{purchase.supplierName}</span></div>
            )}
            <div><span className="text-muted-foreground">{t("common.date")}:</span> <span className="font-medium">{formatDate(purchase.purchasedAt)}</span></div>
            <div><span className="text-muted-foreground">{t("purchases.status")}:</span> <Badge className={`text-[10px] h-4 px-1.5 ${STATUS_COLORS[purchase.status] ?? ""} border-0`}>{STATUS_LABELS[purchase.status] ?? purchase.status}</Badge></div>
          </div>
          <Separator />
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {(purchase.items ?? []).map((item: PurchaseItem, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{item.productNameBn}</span>
                  <span className="text-muted-foreground">{item.quantity} × ৳{item.costPrice} = <span className="text-foreground font-medium">৳{(item.quantity * item.costPrice).toFixed(2)}</span></span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Separator />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("common.total")}</span><span className="font-bold">{formatCurrency(purchase.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("purchases.paid")}</span><span className="text-emerald-600 font-medium">{formatCurrency(purchase.paid)}</span></div>
            {purchase.due > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t("purchases.due")}</span><span className="text-red-600 font-medium">{formatCurrency(purchase.due)}</span></div>}
          </div>
          {purchase.due > 0 && (
            <div>
              {!showPay ? (
                <Button variant="outline" className="w-full rounded-xl gap-2 h-9" onClick={() => setShowPay(true)}>
                  <DollarSign className="h-4 w-4" />{t("purchases.payDue")}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    className="h-9 rounded-xl flex-1"
                    type="number"
                    placeholder={t("purchases.enterAmount")}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                  <Button className="h-9 rounded-xl gap-1.5" disabled={paying || !payAmount}
                    onClick={() => payDue({ id: purchase.id, data: { amount: Number(payAmount) } })}>
                    <CheckCircle className="h-4 w-4" />{t("purchases.confirmPay")}
                  </Button>
                  <Button variant="ghost" className="h-9 rounded-xl" onClick={() => setShowPay(false)}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreatePurchaseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState<string>("");
  const [paid, setPaid] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<Array<{ productNameBn: string; quantity: string; costPrice: string }>>([
    { productNameBn: "", quantity: "", costPrice: "" },
  ]);

  const { data: suppliers } = useListSuppliers({}, { query: { queryKey: getListSuppliersQueryKey({}) } });
  const { data: products } = useListProducts({}, { query: { queryKey: ["list-products-purchase"] } });

  const { mutate: create, isPending } = useCreatePurchase({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPurchaseStatsQueryKey() });
        toast({ title: t("purchases.created") });
        onClose();
      },
      onError: () => toast({ title: t("purchases.createFailed"), variant: "destructive" }),
    },
  });

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0);

  function addItem() {
    setItems([...items, { productNameBn: "", quantity: "", costPrice: "" }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function handleCreate() {
    const validItems = items.filter(i => i.productNameBn.trim() && Number(i.quantity) > 0 && Number(i.costPrice) >= 0);
    if (validItems.length === 0) {
      toast({ title: t("purchases.itemsRequired"), variant: "destructive" });
      return;
    }
    create({
      data: {
        supplierId: supplierId ? Number(supplierId) : null,
        total,
        paid: Number(paid) || 0,
        note: note || null,
        items: validItems.map(i => ({
          productNameBn: i.productNameBn.trim(),
          quantity: Number(i.quantity),
          costPrice: Number(i.costPrice),
        })),
      },
    });
  }

  type SupplierItem = { id: number; name: string };
  type ProductItem = { id: number; nameBn: string; costPrice?: string | null };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4" />{t("purchases.newPurchase")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-1">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">{t("purchases.supplier")}</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="h-9 rounded-xl text-sm">
                    <SelectValue placeholder={t("purchases.selectSupplier")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {((suppliers as SupplierItem[] | undefined) ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t("purchases.paid")}</Label>
                <Input className="h-9 rounded-xl text-sm" type="number" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t("purchases.items")}</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 rounded-lg" onClick={addItem}>
                  <Plus className="h-3 w-3" />{t("purchases.addItem")}
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      className="h-8 rounded-lg text-xs"
                      list={`products-${i}`}
                      placeholder={t("purchases.productName")}
                      value={item.productNameBn}
                      onChange={(e) => {
                        const upd = [...items];
                        upd[i].productNameBn = e.target.value;
                        const matched = ((products as ProductItem[] | undefined) ?? []).find(p => p.nameBn === e.target.value);
                        if (matched && matched.costPrice) upd[i].costPrice = String(matched.costPrice);
                        setItems(upd);
                      }}
                    />
                    <datalist id={`products-${i}`}>
                      {((products as ProductItem[] | undefined) ?? []).map(p => <option key={p.id} value={p.nameBn} />)}
                    </datalist>
                  </div>
                  <Input className="h-8 rounded-lg text-xs w-20" type="number" placeholder={t("common.quantity")} value={item.quantity}
                    onChange={(e) => { const upd = [...items]; upd[i].quantity = e.target.value; setItems(upd); }} />
                  <Input className="h-8 rounded-lg text-xs w-24" type="number" placeholder={t("common.price")} value={item.costPrice}
                    onChange={(e) => { const upd = [...items]; upd[i].costPrice = e.target.value; setItems(upd); }} />
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={() => removeItem(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("common.total")}</span>
              <span className="font-bold text-base">৳{total.toFixed(2)}</span>
            </div>
            {total > Number(paid) && paid !== "" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("purchases.due")}</span>
                <span className="text-red-600 font-semibold">৳{(total - Number(paid)).toFixed(2)}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">{t("common.note")}</Label>
              <Input className="h-9 rounded-xl text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("purchases.notePlaceholder")} />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>{t("common.cancel")}</Button>
          <Button className="rounded-xl gap-2" onClick={handleCreate} disabled={isPending}>
            {isPending ? t("common.loading") : t("purchases.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PurchasesPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocale();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: purchases, isLoading } = useListPurchases({
    query: { queryKey: getListPurchasesQueryKey() },
  });

  const { data: stats } = useGetPurchaseStats({
    query: { queryKey: getGetPurchaseStatsQueryKey() },
  });

  const { mutate: deletePurchase } = useDeletePurchase({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPurchaseStatsQueryKey() });
        toast({ title: t("purchases.deleted") });
      },
      onError: () => toast({ title: t("purchases.deleteFailed"), variant: "destructive" }),
    },
  });

  const items = (purchases as Purchase[] | undefined) ?? [];

  return (
    <div className="space-y-5">
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-end">
        <Button className="rounded-xl gap-2 h-9" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />{t("purchases.newPurchase")}
        </Button>
      </motion.div>

      {stats && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t("purchases.totalPurchases"), value: stats.totalPurchases, icon: ShoppingBag, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/15" },
            { label: t("purchases.totalAmount"), value: formatCurrency(stats.totalAmount), icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/15" },
            { label: t("purchases.totalPaid"), value: formatCurrency(stats.totalPaid), icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/15" },
            { label: t("purchases.totalDue"), value: formatCurrency(stats.totalDue), icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/15" },
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
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 opacity-20" />
            <p className="text-sm">{t("purchases.noPurchases")}</p>
          </div>
        )}
        {!isLoading && items.length > 0 && (
          <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">{t("purchases.list")}</CardTitle>
            </CardHeader>
            <div className="divide-y divide-border/30">
              {items.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{p.invoiceNumber}</span>
                      <Badge className={`text-[10px] h-4 px-1.5 border-0 ${STATUS_COLORS[p.status] ?? ""}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {p.supplierName && <span className="text-xs text-muted-foreground">{p.supplierName}</span>}
                      <span className="text-xs text-muted-foreground">{formatDate(p.purchasedAt)}</span>
                      <span className="text-xs text-muted-foreground">{p.itemCount} {t("purchases.items")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{formatCurrency(p.total)}</p>
                    {p.due > 0 && <p className="text-xs text-red-500">{t("purchases.due")}: {formatCurrency(p.due)}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted/60" onClick={() => setViewId(p.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("purchases.deleteConfirmTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>{t("purchases.deleteConfirmDesc")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90"
                            onClick={() => deletePurchase({ id: p.id })}>
                            {t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>

      <CreatePurchaseDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {viewId !== null && (
        <PurchaseDetailDialog id={viewId} open={true} onClose={() => setViewId(null)} />
      )}
    </div>
  );
}
