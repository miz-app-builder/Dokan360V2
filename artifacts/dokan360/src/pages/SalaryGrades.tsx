import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import {
  useListSalaryGrades,
  useCreateSalaryGrade,
  useUpdateSalaryGrade,
  useDeleteSalaryGrade,
} from "@workspace/api-client-react";
import type { SalaryGrade } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBDT(n: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const PERCENT_FIELDS = [
  "basicPercent",
  "houseRentPercent",
  "medicalPercent",
  "transportPercent",
  "foodPercent",
  "otherPercent",
] as const;

type PercentField = (typeof PERCENT_FIELDS)[number];

interface FormState {
  name:             string;
  description:      string;
  basicPercent:     string;
  houseRentPercent: string;
  medicalPercent:   string;
  transportPercent: string;
  foodPercent:      string;
  otherPercent:     string;
}

const DEFAULT_FORM: FormState = {
  name:             "",
  description:      "",
  basicPercent:     "60",
  houseRentPercent: "25",
  medicalPercent:   "5",
  transportPercent: "5",
  foodPercent:      "5",
  otherPercent:     "0",
};

function sumPercents(form: FormState): number {
  return PERCENT_FIELDS.reduce((s, k) => s + (Number(form[k]) || 0), 0);
}

// ─── Grade card ───────────────────────────────────────────────────────────────

interface GradeCardProps {
  grade:    SalaryGrade;
  onEdit:   (g: SalaryGrade) => void;
  onDelete: (g: SalaryGrade) => void;
  t:        ReturnType<typeof useTranslation>["t"];
}

function GradeCard({ grade, onEdit, onDelete, t }: GradeCardProps) {
  const EXAMPLE_SALARY = 10000;
  const rows: { labelKey: PercentField; pct: number }[] = [
    { labelKey: "basicPercent",     pct: grade.basicPercent },
    { labelKey: "houseRentPercent", pct: grade.houseRentPercent },
    { labelKey: "medicalPercent",   pct: grade.medicalPercent },
    { labelKey: "transportPercent", pct: grade.transportPercent },
    { labelKey: "foodPercent",      pct: grade.foodPercent },
    { labelKey: "otherPercent",     pct: grade.otherPercent },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold truncate">{grade.name}</span>
            </div>
            {grade.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{grade.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(grade)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(grade)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="p-4 space-y-1.5 text-xs">
          <p className="text-muted-foreground font-medium mb-2">
            {t("salaryGrades.example")} ({fmtBDT(EXAMPLE_SALARY)})
          </p>
          {rows.map(({ labelKey, pct }) => (
            <div key={labelKey} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-20 shrink-0 text-muted-foreground">{t(`salaryGrades.${labelKey}`)}</div>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                <Badge variant="outline" className="text-[10px] py-0 h-4">{pct}%</Badge>
                <span className="text-muted-foreground w-16 text-right">
                  {fmtBDT(EXAMPLE_SALARY * pct / 100)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Grade form dialog ────────────────────────────────────────────────────────

type GradePayload = {
  name:             string;
  description?:     string;
  basicPercent:     number;
  houseRentPercent: number;
  medicalPercent:   number;
  transportPercent: number;
  foodPercent:      number;
  otherPercent:     number;
};

interface GradeFormDialogProps {
  open:      boolean;
  grade:     SalaryGrade | null;
  onClose:   () => void;
  onCreate:  (data: GradePayload) => void;
  onUpdate:  (id: number, data: Partial<GradePayload>) => void;
  isPending: boolean;
  t:         ReturnType<typeof useTranslation>["t"];
}

function GradeFormDialog({ open, grade, onClose, onCreate, onUpdate, isPending, t }: GradeFormDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (grade) {
      setForm({
        name:             grade.name,
        description:      grade.description ?? "",
        basicPercent:     String(grade.basicPercent),
        houseRentPercent: String(grade.houseRentPercent),
        medicalPercent:   String(grade.medicalPercent),
        transportPercent: String(grade.transportPercent),
        foodPercent:      String(grade.foodPercent),
        otherPercent:     String(grade.otherPercent),
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [grade, open]);

  function patch(key: keyof FormState, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  const total = sumPercents(form);
  const isValid = Math.round(total * 100) === 10000 && form.name.trim().length > 0;

  function handleSubmit() {
    const payload = {
      name:             form.name.trim(),
      description:      form.description.trim() || undefined,
      basicPercent:     Number(form.basicPercent),
      houseRentPercent: Number(form.houseRentPercent),
      medicalPercent:   Number(form.medicalPercent),
      transportPercent: Number(form.transportPercent),
      foodPercent:      Number(form.foodPercent),
      otherPercent:     Number(form.otherPercent),
    };
    if (grade) {
      onUpdate(grade.id, payload);
    } else {
      onCreate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{grade ? t("salaryGrades.edit") : t("salaryGrades.new")}</DialogTitle>
          <DialogDescription>{t("salaryGrades.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label>{t("salaryGrades.name")} *</Label>
            <Input
              placeholder={t("salaryGrades.namePlaceholder")}
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>{t("salaryGrades.description")}</Label>
            <Textarea
              rows={2}
              placeholder={t("salaryGrades.descPlaceholder")}
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
            />
          </div>

          <Separator />

          {/* Percentages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">{t("salaryGrades.percentages")}</Label>
              <span className={`text-xs font-mono ${Math.round(total * 100) === 10000 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                {t("salaryGrades.currentSum")}: {total.toFixed(2)}%
              </span>
            </div>

            {PERCENT_FIELDS.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <Label className="w-36 shrink-0 text-xs">{t(`salaryGrades.${key}`)}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form[key]}
                    onChange={(e) => patch(key, e.target.value)}
                    className="h-8 w-24 text-sm text-right"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}

            {Math.round(total * 100) !== 10000 && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("salaryGrades.percentSum")} (বর্তমান: {total.toFixed(2)}%)
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button disabled={!isValid || isPending} onClick={handleSubmit}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SalaryGrades() {
  const { t } = useTranslation();
  const { setSubtitle } = usePageSubtitle();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<SalaryGrade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalaryGrade | null>(null);

  useEffect(() => {
    setSubtitle(t("salaryGrades.subtitle"));
    return () => setSubtitle(null);
  }, [t, setSubtitle]);

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["/api/salary-grades"] });

  const listQ = useListSalaryGrades();

  const createMut = useCreateSalaryGrade({
    mutation: {
      onSuccess: () => {
        invalidate();
        setFormOpen(false);
        toast({ title: t("salaryGrades.created") });
      },
    },
  });

  const updateMut = useUpdateSalaryGrade({
    mutation: {
      onSuccess: () => {
        invalidate();
        setFormOpen(false);
        setEditTarget(null);
        toast({ title: t("salaryGrades.updated") });
      },
    },
  });

  const deleteMut = useDeleteSalaryGrade({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDeleteTarget(null);
        toast({ title: t("salaryGrades.deleted") });
      },
    },
  });

  const grades = listQ.data ?? [];

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(g: SalaryGrade) {
    setEditTarget(g);
    setFormOpen(true);
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
          <h1 className="text-2xl font-bold tracking-tight">{t("salaryGrades.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("salaryGrades.subtitle")}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {t("salaryGrades.new")}
        </Button>
      </motion.div>

      {/* Grade cards */}
      <motion.div variants={fadeInUp}>
        {listQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
          </div>
        ) : listQ.isError ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{String(listQ.error)}</p>
            </CardContent>
          </Card>
        ) : grades.length === 0 ? (
          <Card>
            <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">{t("salaryGrades.noGrades")}</p>
              <p className="text-sm text-muted-foreground">{t("salaryGrades.noGradesHint")}</p>
              <Button onClick={openCreate} variant="outline" className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                {t("salaryGrades.new")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grades.map((g) => (
              <GradeCard key={g.id} grade={g} t={t} onEdit={openEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Form dialog */}
      <GradeFormDialog
        open={formOpen}
        grade={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onCreate={(data) => createMut.mutate({ data })}
        onUpdate={(id, data) => updateMut.mutate({ id, data })}
        isPending={createMut.isPending || updateMut.isPending}
        t={t}
      />

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("salaryGrades.delete")}</DialogTitle>
            <DialogDescription>
              {t("salaryGrades.deleteConfirm")} — <strong>{deleteTarget?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteTarget && deleteMut.mutate({ id: deleteTarget.id })}
            >
              {t("salaryGrades.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
