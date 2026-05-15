import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListAttendance,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  getListAttendanceQueryKey,
  customFetch,
  type AttendanceRecord,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EmpBasic   = { id: number; name: string };
type StatusKey  = "present" | "absent" | "late" | "half_day" | "holiday" | "leave";

const STATUS_BADGE: Record<StatusKey, string> = {
  present:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  late:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  absent:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  half_day: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  holiday:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  leave:    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const STATUSES: StatusKey[] = ["present", "absent", "late", "half_day", "holiday", "leave"];

function fmtTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: string, locale: string): string {
  return new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}


type FormState = {
  employeeId: string;
  date:       string;
  status:     StatusKey;
  checkIn:    string;
  checkOut:   string;
  note:       string;
};

const EMPTY_FORM: FormState = {
  employeeId: "", date: "", status: "present", checkIn: "", checkOut: "", note: "",
};

export function HistoryTab() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const qc          = useQueryClient();
  const { toast } = useToast();

  const [filterEmpId,  setFilterEmpId]  = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFrom,   setFilterFrom]   = useState("");
  const [filterTo,     setFilterTo]     = useState("");
  const [page,         setPage]         = useState(1);

  const [showForm,   setShowForm]   = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);

  const params = {
    page,
    limit:      20,
    ...(filterEmpId  !== "all" && { employeeId: Number(filterEmpId) }),
    ...(filterStatus !== "all" && { status: filterStatus as StatusKey }),
    ...(filterFrom   && { from: filterFrom }),
    ...(filterTo     && { to: filterTo }),
  };

  const { data, isLoading } = useListAttendance(params);
  const createMut = useCreateAttendance();
  const updateMut = useUpdateAttendance();
  const deleteMut = useDeleteAttendance();

  const { data: empList } = useQuery({
    queryKey: ["employees-basic"],
    queryFn:  () => customFetch<EmpBasic[]>("/api/employees?status=active&limit=200"),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
  }

  function openCreate() {
    setEditRecord(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setShowForm(true);
  }

  function openEdit(rec: AttendanceRecord) {
    setEditRecord(rec);
    setForm({
      employeeId: String(rec.employeeId),
      date:       rec.date,
      status:     rec.status as StatusKey,
      checkIn:    rec.checkIn  ? new Date(rec.checkIn).toTimeString().slice(0, 5)  : "",
      checkOut:   rec.checkOut ? new Date(rec.checkOut).toTimeString().slice(0, 5) : "",
      note:       rec.note ?? "",
    });
    setShowForm(true);
  }

  function buildDateTime(date: string, time: string): string | undefined {
    if (!time) return undefined;
    return new Date(`${date}T${time}:00`).toISOString();
  }

  function handleSave() {
    if (!form.employeeId || !form.date) return;
    const payload = {
      employeeId: Number(form.employeeId),
      date:       form.date,
      status:     form.status,
      checkIn:    buildDateTime(form.date, form.checkIn),
      checkOut:   buildDateTime(form.date, form.checkOut),
      note:       form.note || undefined,
    };

    if (editRecord) {
      updateMut.mutate(
        { id: editRecord.id, data: payload },
        {
          onSuccess: () => { toast({ title: t("attendance.saveSuccess") }); invalidate(); setShowForm(false); },
          onError:   (e: Error) => toast({ title: t("attendance.saveFailed"), description: e.message, variant: "destructive" }),
        },
      );
    } else {
      createMut.mutate(
        { data: payload as Parameters<typeof createMut.mutate>[0]["data"] },
        {
          onSuccess: () => { toast({ title: t("attendance.saveSuccess") }); invalidate(); setShowForm(false); },
          onError:   (e: Error) => toast({ title: t("attendance.saveFailed"), description: e.message, variant: "destructive" }),
        },
      );
    }
  }

  function handleDelete(id: number) {
    deleteMut.mutate(
      { id },
      {
        onSuccess: () => { toast({ title: t("attendance.deleteSuccess") }); invalidate(); setDeleteId(null); },
        onError:   (e: Error) => toast({ title: t("attendance.deleteFailed"), description: e.message, variant: "destructive" }),
      },
    );
  }

  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <Card className="border border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <Select value={filterEmpId} onValueChange={(v) => { setFilterEmpId(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-44 text-sm">
                <SelectValue placeholder={t("attendance.filterAllEmployees")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("attendance.filterAllEmployees")}</SelectItem>
                {(empList ?? []).map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue placeholder={t("attendance.filterAllStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("attendance.filterAllStatus")}</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`attendance.status_${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filterFrom}
                onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
                className="h-9 w-36 text-sm"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="date"
                value={filterTo}
                onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
                className="h-9 w-36 text-sm"
              />
            </div>

            {(filterEmpId !== "all" || filterStatus !== "all" || filterFrom || filterTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterEmpId("all"); setFilterStatus("all"); setFilterFrom(""); setFilterTo(""); setPage(1); }}>
                {t("attendance.resetFilter")}
              </Button>
            )}

            <div className="ml-auto">
              <Button size="sm" onClick={openCreate} className="gap-1.5">
                <Plus className="h-4 w-4" /> {t("attendance.addRecord")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : !data?.data?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>{t("attendance.noData")}</p>
            <p className="text-sm mt-1">{t("attendance.noDataDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.data.map((rec) => {
              const statusCls = STATUS_BADGE[rec.status as StatusKey] ?? "";
              return (
                <Card key={rec.id} className="border border-border/50">
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                      <div>
                        <p className="text-sm font-medium truncate">{rec.employeeName}</p>
                        {rec.employeeCode && <p className="text-xs text-muted-foreground">{rec.employeeCode}</p>}
                      </div>
                      <p className="text-sm text-muted-foreground">{fmtDate(rec.date, locale)}</p>
                      <div className="text-sm text-muted-foreground">
                        {fmtTime(rec.checkIn, locale)} → {fmtTime(rec.checkOut, locale)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border-0 text-xs", statusCls)}>
                          {t(`attendance.status_${rec.status}`)}
                        </Badge>
                        {rec.lateMinutes > 0 && (
                          <span className="text-xs text-amber-600">
                            {t("attendance.lateMinutes", { minutes: rec.lateMinutes })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(rec)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(rec.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editRecord ? t("attendance.editRecord") : t("attendance.addRecord")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editRecord && (
              <div className="grid gap-1.5">
                <Label>{t("attendance.colEmployee")}</Label>
                <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("attendance.selectEmployee")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(empList ?? []).map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label>{t("attendance.colDate")}</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="h-9" />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("attendance.colStatus")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as StatusKey }))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`attendance.status_${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>{t("attendance.checkInTime")}</Label>
                <Input type="time" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} className="h-9" />
              </div>
              <div className="grid gap-1.5">
                <Label>{t("attendance.checkOutTime")}</Label>
                <Input type="time" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} className="h-9" />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>{t("attendance.note")}</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder={t("attendance.notePlaceholder")}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("attendance.deleteRecord")}</AlertDialogTitle>
            <AlertDialogDescription>{t("attendance.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleteMut.isPending}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
