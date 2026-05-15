import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useCollectPayment,
  getListCustomersQueryKey,
  getGetCustomerLedgerQueryKey,
} from "@workspace/api-client-react";
import type { Customer } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Users, TrendingDown, TrendingUp, X } from "lucide-react";
import { CustomerFormDialog, type CustomerFormValues } from "@/components/customers/CustomerFormDialog";
import { CustomerLedgerDialog } from "@/components/customers/CustomerLedgerDialog";
import { CustomerPaymentDialog } from "@/components/customers/CustomerPaymentDialog";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { staggerContainer, fadeInUp, scaleIn } from "@/lib/motion";

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, accent, iconColor }: {
  icon: React.ElementType; label: string; value: string | number;
  accent: string; iconColor: string;
}) {
  return (
    <motion.div variants={fadeInUp} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm cursor-default">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-foreground leading-tight">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
export default function Customers() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch]               = useState("");
  const [formOpen, setFormOpen]           = useState(false);
  const [editCustomer, setEditCustomer]   = useState<Customer | null>(null);
  const [ledgerCustomer, setLedgerCustomer]   = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useListCustomers({ search: search || undefined });

  const createMutation  = useCreateCustomer();
  const updateMutation  = useUpdateCustomer();
  const deleteMutation  = useDeleteCustomer();
  const paymentMutation = useCollectPayment();

  const invalidateList   = () => qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
  const invalidateLedger = (id: number) => qc.invalidateQueries({ queryKey: getGetCustomerLedgerQueryKey(id) });

  const allCustomers    = customers ?? [];
  const totalDue        = allCustomers.reduce((sum: number, c: Customer) => sum + Math.abs(Math.min(Number(c.balance), 0)), 0);
  const totalPurchase   = allCustomers.reduce((sum: number, c: Customer) => sum + Number(c.totalPurchase), 0);
  const customersWithDue = allCustomers.filter((c: Customer) => Number(c.balance) < 0).length;

  const openCreate = () => { setEditCustomer(null); setFormOpen(true); };
  const openEdit   = (c: Customer) => { setEditCustomer(c); setFormOpen(true); };

  const handleFormSubmit = (values: CustomerFormValues, isEdit: boolean) => {
    const payload = {
      name:    values.name.trim(),
      phone:   values.phone.trim() || null,
      email:   values.email.trim() || null,
      address: values.address.trim() || null,
    };
    if (isEdit && editCustomer) {
      updateMutation.mutate(
        { id: editCustomer.id, data: payload },
        {
          onSuccess: () => { toast({ title: t("customers.editSuccess") }); setFormOpen(false); invalidateList(); },
          onError:   () => toast({ variant: "destructive", title: t("customers.deleteError") }),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => { toast({ title: t("customers.addSuccess") }); setFormOpen(false); invalidateList(); },
          onError:   () => toast({ variant: "destructive", title: t("customers.addError") }),
        }
      );
    }
  };

  const handleDelete = (customer: Customer) => {
    deleteMutation.mutate(
      { id: customer.id },
      {
        onSuccess: () => { toast({ title: t("customers.deleteSuccess") }); invalidateList(); },
        onError:   (err: any) => {
          const msg = err?.response?.data?.error ?? t("customers.deleteError");
          toast({ variant: "destructive", title: msg });
        },
      }
    );
  };

  const handleOpenLedger  = (c: Customer) => setLedgerCustomer(c);
  const handleOpenPayment = (c: Customer) => { setPaymentCustomer(c); setLedgerCustomer(null); };

  const handleCollectPayment = (amount: number, note: string) => {
    if (!paymentCustomer) return;
    paymentMutation.mutate(
      { id: paymentCustomer.id, data: { amount, note } },
      {
        onSuccess: (updated: Customer) => {
          toast({ title: t("customers.paymentSuccess") });
          setPaymentCustomer(null);
          invalidateList();
          invalidateLedger(updated.id);
        },
        onError: () => toast({ variant: "destructive", title: t("customers.paymentError") }),
      }
    );
  };

  const hasSearch = search.trim().length > 0;

  return (
    <div className="space-y-5 max-w-screen-2xl mx-auto">

      {/* Action bar */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="flex justify-end">
        <Button onClick={openCreate} className="gap-2 shrink-0 rounded-xl shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          {t("customers.addNew")}
        </Button>
      </motion.div>

      {/* Stats */}
      {!isLoading && allCustomers.length > 0 && (
        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <StatCard icon={Users}        label={t("customers.totalCustomers")}  value={allCustomers.length}
            accent="bg-primary/10"      iconColor="text-primary" />
          <StatCard icon={TrendingDown} label={t("customers.totalDue")}         value={formatCurrency(totalDue)}
            accent={totalDue > 0 ? "bg-destructive/10" : "bg-emerald-500/10"}
            iconColor={totalDue > 0 ? "text-destructive" : "text-emerald-600"} />
          <StatCard icon={TrendingUp}   label={t("customers.totalSales")}       value={formatCurrency(totalPurchase)}
            accent="bg-blue-500/10"     iconColor="text-blue-600 dark:text-blue-400" />
        </motion.div>
      )}

      {/* Search */}
      <motion.div initial="hidden" animate="visible" variants={fadeInUp}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 h-9 rounded-xl border-border/70 bg-card"
            placeholder={t("customers.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {hasSearch && (
          <Button variant="ghost" size="sm"
            className="h-9 gap-1.5 text-muted-foreground rounded-xl"
            onClick={() => setSearch("")}
          >
            <X className="h-3.5 w-3.5" /> {t("customers.clearSearch")}
          </Button>
        )}
        {hasSearch && !isLoading && (
          <p className="text-sm text-muted-foreground">{allCustomers.length} {t("customers.results")}</p>
        )}
      </motion.div>

      {/* Customer grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : allCustomers.length === 0 ? (
        <motion.div initial="hidden" animate="visible" variants={scaleIn}
          className="flex flex-col items-center py-20 text-muted-foreground gap-4"
        >
          <div className="h-16 w-16 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center">
            <Users className="h-7 w-7 opacity-40" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">
              {hasSearch ? t("customers.noCustomersFound") : t("customers.noCustomersYet")}
            </p>
            <p className="text-sm mt-1">
              {hasSearch ? t("customers.searchHint") : t("customers.addFirst")}
            </p>
          </div>
          {!hasSearch && (
            <Button onClick={openCreate} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> {t("customers.addFirst")}
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial="hidden" animate="visible" variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
        >
          {allCustomers.map((c: Customer) => (
            <motion.div key={c.id} variants={fadeInUp}>
              <CustomerCard
                customer={c}
                onEdit={openEdit}
                onLedger={handleOpenLedger}
                onPayment={handleOpenPayment}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Due summary banner */}
      {!isLoading && customersWithDue > 0 && !hasSearch && (
        <motion.div initial="hidden" animate="visible" variants={fadeInUp}
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 flex items-center gap-3"
        >
          <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            <span className="font-semibold">{t("customers.dueCustomers", { count: customersWithDue })}</span>
            {" "}{t("customers.dueSummary")}{" "}
            <span className="font-semibold">{formatCurrency(totalDue)}</span>
          </p>
        </motion.div>
      )}

      {/* Dialogs */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editCustomer={editCustomer}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
      {ledgerCustomer && (
        <CustomerLedgerDialog
          customer={ledgerCustomer}
          onClose={() => setLedgerCustomer(null)}
          onCollectPayment={() => handleOpenPayment(ledgerCustomer)}
        />
      )}
      {paymentCustomer && (
        <CustomerPaymentDialog
          customer={paymentCustomer}
          onClose={() => setPaymentCustomer(null)}
          onSubmit={handleCollectPayment}
          isPending={paymentMutation.isPending}
        />
      )}
    </div>
  );
}
