import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  useListPayroll,
  useGetPayrollStats,
  useGeneratePayroll,
  useMarkPayrollPaid,
  useUpdatePayrollRecord,
  useDeletePayrollRecord,
} from "@workspace/api-client-react";
import type { PayrollRecord } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Banknote,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  CircleCheck,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtBDT(n: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const MONTH_KEYS = [
  "1","2","3","4","5","6","7","8","9","10","11","12",
] as const;

// ─── types ────────────────────────────────────────────────────────────────────

interface EditState {
  record: PayrollRecord;
  // allowances
  houseRentAllowance:    string;
  medicalAllowance:      string;
  transportAllowance:    string;
  foodAllowance:         string;
  commission:            string;
  overtimePay:           string;
  bonus:                 string;
  // deductions
  advance:               string;
  otherDeductions:       string;
  providentFundEmployee: string;
  providentFundEmployer: string;
  taxDeduction:          string;
  loanDeduction:         string;
  note:                  string;
}

// ─── stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── payroll row ──────────────────────────────────────────────────────────────

interface PayrollRowProps {
  record: PayrollRecord;
  onEdit:   (r: PayrollRecord) => void;
  onPay:    (r: PayrollRecord) => void;
  onDelete: (r: PayrollRecord) => void;
  t: ReturnType<typeof useTranslation>["t"];
}

function PayrollRow({ record, onEdit, onPay, onDelete, t }: PayrollRowProps) {
  const isPaid = record.paymentStatus === "paid";
  const [expanded, setExpanded] = useState(false);

  const totalAllowances =
    record.houseRentAllowance +
    record.medicalAllowance +
    record.transportAllowance +
    record.foodAllowance +
    record.commission +
    record.overtimePay +
    record.bonus;

  const totalDeductions =
    record.advance +
    record.otherDeductions +
    record.unpaidLeaveDeduction +
    record.providentFundEmployee +
    record.taxDeduction +
    record.loanDeduction;

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      {/* ── Summary row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{record.employeeName}</span>
            {record.employeeCode && (
              <span className="text-xs text-muted-foreground">#{record.employeeCode}</span>
            )}
            <Badge
              variant={isPaid ? "default" : "outline"}
              className={
                isPaid
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "text-amber-600 border-amber-400"
              }
            >
              {isPaid ? t("payroll.paid") : t("payroll.unpaid")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>{t("payroll.baseSalary")}: {fmtBDT(record.baseSalary)}</span>
            <span>{t("payroll.presentDays")}: {record.presentDays}/{record.workingDays}</span>
            <span>{t("payroll.allowances")}: {fmtBDT(totalAllowances)}</span>
            <span>{t("payroll.deductions")}: {fmtBDT(totalDeductions)}</span>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="text-muted-foreground">
              {t("payroll.grossSalary")}: <span className="text-foreground font-medium">{fmtBDT(record.grossSalary)}</span>
            </span>
            <span className="text-muted-foreground">
              {t("payroll.netSalary")}: <span className="text-primary font-semibold">{fmtBDT(record.netSalary)}</span>
            </span>
          </div>

          {record.note && (
            <p className="text-xs text-muted-foreground italic">"{record.note}"</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((p) => !p)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
          {!isPaid && (
            <Button size="sm" variant="outline" onClick={() => onPay(record)} className="h-8 text-xs gap-1">
              <CircleCheck className="h-3.5 w-3.5" />
              {t("payroll.markPaid")}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onEdit(record)} className="h-8 w-8 p-0">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(record)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Expanded breakdown ── */}
      {expanded && (
        <div className="border-t bg-muted/30 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Earnings */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground mb-1">{t("payroll.allowances")}</p>
            <DetailRow label={t("payroll.baseSalary")}         value={fmtBDT(record.baseSalary)} />
            <DetailRow label={t("payroll.houseRentAllowance")} value={fmtBDT(record.houseRentAllowance)} />
            <DetailRow label={t("payroll.medicalAllowance")}   value={fmtBDT(record.medicalAllowance)} />
            <DetailRow label={t("payroll.transportAllowance")} value={fmtBDT(record.transportAllowance)} />
            <DetailRow label={t("payroll.foodAllowance")}      value={fmtBDT(record.foodAllowance)} />
            <DetailRow label={t("payroll.commission")}         value={fmtBDT(record.commission)} />
            <DetailRow label={t("payroll.overtimePay")}        value={fmtBDT(record.overtimePay)} />
            <DetailRow label={t("payroll.bonus")}              value={fmtBDT(record.bonus)} />
            <Separator className="my-1" />
            <DetailRow label={t("payroll.grossSalary")} value={fmtBDT(record.grossSalary)} bold />
          </div>

          {/* Deductions */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground mb-1">{t("payroll.deductions")}</p>
            <DetailRow label={t("payroll.advance")}               value={fmtBDT(record.advance)} />
            <DetailRow label={t("payroll.otherDeductions")}       value={fmtBDT(record.otherDeductions)} />
            <DetailRow label={t("payroll.unpaidLeave")}           value={fmtBDT(record.unpaidLeaveDeduction)} />
            <DetailRow label={t("payroll.providentFundEmployee")} value={fmtBDT(record.providentFundEmployee)} />
            <DetailRow label={t("payroll.providentFundEmployer")} value={fmtBDT(record.providentFundEmployer)} note="(employer cost)" />
            <DetailRow label={t("payroll.taxDeduction")}          value={fmtBDT(record.taxDeduction)} />
            <DetailRow label={t("payroll.loanDeduction")}         value={fmtBDT(record.loanDeduction)} />
            <Separator className="my-1" />
            <DetailRow label={t("payroll.netSalary")} value={fmtBDT(record.netSalary)} bold primary />
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  bold = false,
  primary = false,
  note,
}: {
  label: string;
  value: string;
  bold?: boolean;
  primary?: boolean;
  note?: string;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className={`text-muted-foreground ${bold ? "font-semibold text-foreground" : ""}`}>
        {label}{note && <span className="ml-1 text-muted-foreground/60">{note}</span>}
      </span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""} ${primary ? "text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}

// ─── edit dialog field group ───────────────────────────────────────────────────

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Payroll() {
  const { t } = useTranslation();
  const { setSubtitle } = usePageSubtitle();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const [generateOpen, setGenerateOpen] = useState(false);
  const [editState, setEditState]       = useState<EditState | null>(null);
  const [payTarget, setPayTarget]       = useState<PayrollRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    setSubtitle(t("payroll.subtitle"));
    return () => setSubtitle(null);
  }, [t, setSubtitle]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
  }, [queryClient]);

  const listQ  = useListPayroll({ month, year });
  const statsQ = useGetPayrollStats({ month, year });

  const generateMut = useGeneratePayroll({
    mutation: {
      onSuccess: (data) => {
        invalidate();
        setGenerateOpen(false);
        toast({
          title: t("payroll.generated"),
          description: t("payroll.generatedDesc", {
            generated: data.generated,
            skipped:   data.skipped,
          }),
        });
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "";
        toast({
          variant: "destructive",
          title: msg.includes("409") ? t("payroll.alreadyExists") : msg,
        });
      },
    },
  });

  const updateMut = useUpdatePayrollRecord({
    mutation: {
      onSuccess: () => {
        invalidate();
        setEditState(null);
        toast({ title: t("payroll.updated") });
      },
    },
  });

  const payMut = useMarkPayrollPaid({
    mutation: {
      onSuccess: () => {
        invalidate();
        setPayTarget(null);
        toast({ title: t("payroll.markedPaid") });
      },
    },
  });

  const deleteMut = useDeletePayrollRecord({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDeleteTarget(null);
        toast({ title: t("payroll.deleted") });
      },
    },
  });

  const records = listQ.data ?? [];
  const stats   = statsQ.data;
  const years   = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  function openEdit(r: PayrollRecord) {
    setEditState({
      record:                r,
      houseRentAllowance:    String(r.houseRentAllowance),
      medicalAllowance:      String(r.medicalAllowance),
      transportAllowance:    String(r.transportAllowance),
      foodAllowance:         String(r.foodAllowance),
      commission:            String(r.commission),
      overtimePay:           String(r.overtimePay),
      bonus:                 String(r.bonus),
      advance:               String(r.advance),
      otherDeductions:       String(r.otherDeductions),
      providentFundEmployee: String(r.providentFundEmployee),
      providentFundEmployer: String(r.providentFundEmployer),
      taxDeduction:          String(r.taxDeduction),
      loanDeduction:         String(r.loanDeduction),
      note:                  r.note ?? "",
    });
  }

  function patchEdit(key: keyof Omit<EditState, "record">, val: string) {
    setEditState((prev) => prev ? { ...prev, [key]: val } : prev);
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("payroll.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("payroll.subtitle")}</p>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="gap-2 shrink-0">
          <Banknote className="h-4 w-4" />
          {t("payroll.generate")}
        </Button>
      </motion.div>

      {/* Month / Year picker */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 items-center">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_KEYS.map((m) => (
              <SelectItem key={m} value={m}>
                {t(`payroll.months.${m}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(listQ.isFetching || statsQ.isFetching) && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </motion.div>

      {/* Stats */}
      {statsQ.isLoading ? (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </motion.div>
      ) : stats ? (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("payroll.stats.totalEmployees")}
            value={stats.totalEmployees}
            icon={Users}
            color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            label={t("payroll.stats.totalNet")}
            value={fmtBDT(stats.totalNet)}
            icon={TrendingUp}
            color="bg-primary/10 text-primary"
          />
          <StatCard
            label={t("payroll.stats.paid")}
            value={`${fmtBDT(stats.totalPaid)} (${stats.paidCount})`}
            icon={CheckCircle}
            color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          />
          <StatCard
            label={t("payroll.stats.unpaid")}
            value={`${fmtBDT(stats.totalUnpaid)} (${stats.unpaidCount})`}
            icon={Clock}
            color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </motion.div>
      ) : null}

      {/* Records list */}
      <motion.div variants={fadeInUp} className="space-y-2">
        {listQ.isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
        ) : listQ.isError ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{String(listQ.error)}</p>
            </CardContent>
          </Card>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
              <Banknote className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">{t("payroll.noRecords")}</p>
              <p className="text-sm text-muted-foreground">{t("payroll.generateHint")}</p>
            </CardContent>
          </Card>
        ) : (
          records.map((rec) => (
            <PayrollRow
              key={rec.id}
              record={rec}
              t={t}
              onEdit={openEdit}
              onPay={setPayTarget}
              onDelete={setDeleteTarget}
            />
          ))
        )}
      </motion.div>

      {/* ── Generate dialog ─────────────────────────────────────── */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payroll.generate")}</DialogTitle>
            <DialogDescription>
              {t(`payroll.months.${month}`)} {year}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={generateMut.isPending}
              onClick={() => generateMut.mutate({ data: { month, year } })}
            >
              {generateMut.isPending ? t("payroll.generating") : t("payroll.generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ──────────────────────────────────────────── */}
      {editState && (
        <Dialog open onOpenChange={() => setEditState(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("payroll.editRecord")}</DialogTitle>
              <DialogDescription>{editState.record.employeeName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Allowances */}
              <FieldGroup title={t("payroll.allowances")}>
                {(
                  [
                    ["houseRentAllowance",    t("payroll.houseRentAllowance")],
                    ["medicalAllowance",      t("payroll.medicalAllowance")],
                    ["transportAllowance",    t("payroll.transportAllowance")],
                    ["foodAllowance",         t("payroll.foodAllowance")],
                    ["commission",            t("payroll.commission")],
                    ["overtimePay",           t("payroll.overtimePay")],
                    ["bonus",                 t("payroll.bonus")],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-44 shrink-0 text-xs">{label}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editState[key]}
                      onChange={(e) => patchEdit(key, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </FieldGroup>

              <Separator />

              {/* Deductions */}
              <FieldGroup title={t("payroll.deductions")}>
                {(
                  [
                    ["advance",               t("payroll.advance")],
                    ["otherDeductions",       t("payroll.otherDeductions")],
                    ["providentFundEmployee", t("payroll.providentFundEmployee")],
                    ["providentFundEmployer", t("payroll.providentFundEmployer")],
                    ["taxDeduction",          t("payroll.taxDeduction")],
                    ["loanDeduction",         t("payroll.loanDeduction")],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-44 shrink-0 text-xs">{label}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editState[key]}
                      onChange={(e) => patchEdit(key, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </FieldGroup>

              <Separator />

              {/* Note */}
              <div className="space-y-1">
                <Label>{t("payroll.note")}</Label>
                <Textarea
                  rows={2}
                  placeholder={t("payroll.notePlaceholder")}
                  value={editState.note}
                  onChange={(e) => patchEdit("note", e.target.value)}
                />
              </div>

              {/* Live preview */}
              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1.5">
                {(() => {
                  const rec = editState.record;
                  const earnedBase =
                    rec.workingDays > 0
                      ? Math.round((rec.baseSalary / rec.workingDays) * rec.presentDays * 100) / 100
                      : rec.baseSalary;
                  const gross =
                    earnedBase +
                    Number(editState.houseRentAllowance) +
                    Number(editState.medicalAllowance) +
                    Number(editState.transportAllowance) +
                    Number(editState.foodAllowance) +
                    Number(editState.commission) +
                    Number(editState.overtimePay) +
                    Number(editState.bonus);
                  const net = Math.max(
                    0,
                    gross -
                      Number(editState.advance) -
                      Number(editState.otherDeductions) -
                      rec.unpaidLeaveDeduction -
                      Number(editState.providentFundEmployee) -
                      Number(editState.taxDeduction) -
                      Number(editState.loanDeduction),
                  );
                  return (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          {t("payroll.baseSalary")} ({rec.presentDays}/{rec.workingDays} {t("payroll.days")})
                        </span>
                        <span className="text-foreground">{fmtBDT(earnedBase)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("payroll.grossSalary")}</span>
                        <span className="font-medium">{fmtBDT(gross)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("payroll.netSalary")}</span>
                        <span className="font-semibold text-primary">{fmtBDT(net)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditState(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                disabled={updateMut.isPending}
                onClick={() =>
                  updateMut.mutate({
                    id: editState.record.id,
                    data: {
                      houseRentAllowance:    Number(editState.houseRentAllowance),
                      medicalAllowance:      Number(editState.medicalAllowance),
                      transportAllowance:    Number(editState.transportAllowance),
                      foodAllowance:         Number(editState.foodAllowance),
                      commission:            Number(editState.commission),
                      overtimePay:           Number(editState.overtimePay),
                      bonus:                 Number(editState.bonus),
                      advance:               Number(editState.advance),
                      otherDeductions:       Number(editState.otherDeductions),
                      providentFundEmployee: Number(editState.providentFundEmployee),
                      providentFundEmployer: Number(editState.providentFundEmployer),
                      taxDeduction:          Number(editState.taxDeduction),
                      loanDeduction:         Number(editState.loanDeduction),
                      note:                  editState.note || undefined,
                    },
                  })
                }
              >
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Mark paid confirm ────────────────────────────────────── */}
      <Dialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payroll.markPaid")}</DialogTitle>
            <DialogDescription>
              {payTarget?.employeeName} — {fmtBDT(payTarget?.netSalary ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={payMut.isPending}
              onClick={() => payTarget && payMut.mutate({ id: payTarget.id, data: {} })}
            >
              {t("payroll.markPaid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ───────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("payroll.delete")}</DialogTitle>
            <DialogDescription>
              {t("payroll.deleteConfirm")} — {deleteTarget?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
            >
              {t("payroll.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
