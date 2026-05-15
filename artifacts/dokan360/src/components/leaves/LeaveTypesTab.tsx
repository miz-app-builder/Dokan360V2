import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  getListLeaveTypesQueryKey,
  type LeaveType,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, LayoutList, ShieldCheck, Pencil } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LeaveTypeCard } from "./LeaveTypeCard";
import { LeaveTypeFormDialog, EMPTY_FORM, type LeaveTypeFormData } from "./LeaveTypeFormDialog";

export function LeaveTypesTab() {
  const { t }     = useTranslation();
  const { toast } = useToast();
  const qc        = useQueryClient();

  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);
  const [editTarget,   setEditTarget]   = useState<LeaveType | null>(null);
  const [form,         setForm]         = useState<LeaveTypeFormData>(EMPTY_FORM);

  const { data: types = [], isLoading } = useListLeaveTypes();
  const createMut  = useCreateLeaveType();
  const updateMut  = useUpdateLeaveType();
  const deleteMut  = useDeleteLeaveType();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListLeaveTypesQueryKey() });

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(lt: LeaveType) {
    setEditTarget(lt);
    setForm({
      name: lt.name, nameBn: lt.nameBn,
      defaultDays: lt.defaultDays, isPaid: lt.isPaid,
      color: lt.color, isActive: lt.isActive,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.nameBn) return;
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, data: form });
      } else {
        await createMut.mutateAsync({
          data: {
            name: form.name, nameBn: form.nameBn,
            defaultDays: form.defaultDays, isPaid: form.isPaid, color: form.color,
          },
        });
      }
      toast({ title: t("leaves.typeSaved") });
      invalidate();
      setDialogOpen(false);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync({ id: deleteTarget.id });
      toast({ title: t("leaves.typeDeleted") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  }

  const defaultTypes = types.filter((lt) => lt.isDefault);
  const customTypes  = types.filter((lt) => !lt.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("leaves.typesDesc")}</p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />{t("leaves.addType")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : types.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="space-y-6">
          {defaultTypes.length > 0 && (
            <TypeSection
              icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
              label={t("leaves.defaultTypes")}
              types={defaultTypes}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}
          {customTypes.length > 0 && (
            <TypeSection
              icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
              label={t("leaves.customTypes")}
              types={customTypes}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
      )}

      <LeaveTypeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        form={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSave={handleSave}
        isSaving={createMut.isPending || updateMut.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaves.deleteType")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.isDefault
                ? t("leaves.typeDeleteDefaultConfirm")
                : t("leaves.typeDeleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
        <LayoutList className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium">{t("leaves.noTypes")}</p>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1.5" />{t("leaves.addType")}
        </Button>
      </CardContent>
    </Card>
  );
}

type TypeSectionProps = {
  icon:     React.ReactNode;
  label:    string;
  types:    LeaveType[];
  onEdit:   (lt: LeaveType) => void;
  onDelete: (lt: LeaveType) => void;
};

function TypeSection({ icon, label, types, onEdit, onDelete }: TypeSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((lt) => (
          <LeaveTypeCard key={lt.id} lt={lt} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
