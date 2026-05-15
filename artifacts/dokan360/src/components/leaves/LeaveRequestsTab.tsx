import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useListLeaveRequests,
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useDeleteLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useListLeaveTypes,
  getListLeaveRequestsQueryKey,
  customFetch,
  type LeaveRequest,
  type LeaveStatus,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, CheckCircle2, XCircle, MoreVertical, Trash2, Edit2, FileText, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_COLORS: Record<LeaveStatus, string> = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:  "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
  rejected:  "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  cancelled: "bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400",
};

type CreateForm = {
  employeeId: string; leaveTypeId: string;
  fromDate: string; toDate: string; reason: string;
};

type RejectForm = { reason: string };

const DEFAULT_CREATE: CreateForm = { employeeId: "", leaveTypeId: "", fromDate: "", toDate: "", reason: "" };

export function LeaveRequestsTab() {
  const { t, i18n } = useTranslation();
  const { toast }   = useToast();
  const qc          = useQueryClient();
  const isBn        = i18n.language === "bn";

  const [page,         setPage]         = useState(1);
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | "all">("all");
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState<LeaveRequest | null>(null);
  const [createForm,   setCreateForm]   = useState<CreateForm>(DEFAULT_CREATE);
  const [rejectId,     setRejectId]     = useState<number | null>(null);
  const [rejectForm,   setRejectForm]   = useState<RejectForm>({ reason: "" });
  const [deleteId,     setDeleteId]     = useState<number | null>(null);

  const params = {
    page,
    limit: 15,
    ...(filterStatus !== "all" ? { status: filterStatus } : {}),
  };

  const { data, isLoading }       = useListLeaveRequests(params);
  const { data: leaveTypes = [] } = useListLeaveTypes();
  const { data: employees = [] }  = useQuery({
    queryKey: ["employees", "all"],
    queryFn:  () => customFetch<{ id: number; name: string; employeeCode: string | null }[]>("/api/employees"),
  });

  const createMut  = useCreateLeaveRequest();
  const updateMut  = useUpdateLeaveRequest();
  const deleteMut  = useDeleteLeaveRequest();
  const approveMut = useApproveLeaveRequest();
  const rejectMut  = useRejectLeaveRequest();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey() });

  function openCreate() {
    setEditTarget(null); setCreateForm(DEFAULT_CREATE); setDialogOpen(true);
  }

  function openEdit(req: LeaveRequest) {
    setEditTarget(req);
    setCreateForm({ employeeId: String(req.employeeId), leaveTypeId: String(req.leaveTypeId), fromDate: req.fromDate, toDate: req.toDate, reason: req.reason ?? "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    const empId = Number(createForm.employeeId);
    const ltId  = Number(createForm.leaveTypeId);
    if (!empId || !ltId || !createForm.fromDate || !createForm.toDate) return;
    try {
      if (editTarget) {
        await updateMut.mutateAsync({ id: editTarget.id, data: { fromDate: createForm.fromDate, toDate: createForm.toDate, reason: createForm.reason || undefined } });
      } else {
        await createMut.mutateAsync({ data: { employeeId: empId, leaveTypeId: ltId, fromDate: createForm.fromDate, toDate: createForm.toDate, reason: createForm.reason || undefined } });
      }
      toast({ title: t("leaves.requestSaved") });
      invalidate();
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast({ title: msg.includes("overlap") || msg.includes("already") ? t("leaves.overlapError") : t("common.error"), variant: "destructive" });
    }
  }

  async function handleApprove(id: number) {
    try {
      await approveMut.mutateAsync({ id, data: {} });
      toast({ title: t("leaves.approved") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    }
  }

  async function handleReject() {
    if (!rejectId || !rejectForm.reason) return;
    try {
      await rejectMut.mutateAsync({ id: rejectId, data: { reason: rejectForm.reason } });
      toast({ title: t("leaves.rejected") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setRejectId(null); setRejectForm({ reason: "" });
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync({ id: deleteId });
      toast({ title: t("leaves.requestDeleted") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const requests = data?.data ?? [];
  const total    = data?.total ?? 0;
  const pages    = Math.ceil(total / 15);
  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as LeaveStatus | "all"); setPage(1); }}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="pending">{t("leaves.status.pending")}</SelectItem>
              <SelectItem value="approved">{t("leaves.status.approved")}</SelectItem>
              <SelectItem value="rejected">{t("leaves.status.rejected")}</SelectItem>
              <SelectItem value="cancelled">{t("leaves.status.cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />{t("leaves.addRequest")}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : requests.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t("leaves.noRequests")}</p>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />{t("leaves.addRequest")}
          </Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: req.leaveTypeColor + "20", color: req.leaveTypeColor }}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{req.employeeName}</p>
                        {req.employeeCode && <span className="text-xs text-muted-foreground">({req.employeeCode})</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: req.leaveTypeColor + "20", color: req.leaveTypeColor }}>
                          {isBn ? req.leaveTypeNameBn : req.leaveTypeName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {req.fromDate} → {req.toDate}
                          <span className="ml-1 font-medium text-foreground">({req.days}{t("leaves.days")})</span>
                        </span>
                      </div>
                      {req.reason && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.reason}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[req.status])}>
                      {t(`leaves.status.${req.status}`)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {req.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(req.id)} className="text-green-600 focus:text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-2" />{t("leaves.approve")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setRejectId(req.id); setRejectForm({ reason: "" }); }} className="text-red-600 focus:text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />{t("leaves.reject")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(req)}>
                              <Edit2 className="h-4 w-4 mr-2" />{t("common.edit")}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => setDeleteId(req.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />{t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Approved/Rejected by */}
                {(req.approvedByName || req.rejectedReason) && (
                  <div className="mt-2 pl-11 text-xs text-muted-foreground space-y-0.5">
                    {req.approvedByName && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {req.status === "approved" ? t("leaves.approvedBy") : t("leaves.rejectedBy")}: {req.approvedByName}
                        {req.approvedAt && ` · ${format(new Date(req.approvedAt), "dd/MM/yyyy")}`}
                      </p>
                    )}
                    {req.rejectedReason && req.status === "rejected" && (
                      <p className="text-red-500/80">{t("leaves.reason")}: {req.rejectedReason}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">{t("common.total")}: {total}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">{page}/{pages}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? t("leaves.editRequest") : t("leaves.addRequest")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editTarget && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("employees.name")} *</Label>
                  <Select value={createForm.employeeId} onValueChange={(v) => setCreateForm((f) => ({ ...f, employeeId: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("employees.select")} /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e: { id: number; name: string; employeeCode: string | null }) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.name}{e.employeeCode && ` (${e.employeeCode})`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("leaves.type")} *</Label>
                  <Select value={createForm.leaveTypeId} onValueChange={(v) => setCreateForm((f) => ({ ...f, leaveTypeId: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("leaves.selectType")} /></SelectTrigger>
                    <SelectContent>
                      {leaveTypes.filter((lt) => lt.isActive).map((lt) => (
                        <SelectItem key={lt.id} value={String(lt.id)}>{lt.nameBn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("schedule.startTime").replace("সময়", "তারিখ")} *</Label>
                <Input type="date" value={createForm.fromDate} onChange={(e) => setCreateForm((f) => ({ ...f, fromDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("leaves.toDate")} *</Label>
                <Input type="date" value={createForm.toDate} min={createForm.fromDate} onChange={(e) => setCreateForm((f) => ({ ...f, toDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t("leaves.reason")}</Label>
              <Textarea value={createForm.reason} onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))} rows={2} placeholder={t("leaves.reasonPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={isSaving || (!editTarget && (!createForm.employeeId || !createForm.leaveTypeId)) || !createForm.fromDate || !createForm.toDate}>
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t("leaves.reject")}</DialogTitle></DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-xs">{t("leaves.rejectReason")} *</Label>
            <Textarea value={rejectForm.reason} onChange={(e) => setRejectForm({ reason: e.target.value })} rows={3} placeholder={t("leaves.rejectReasonPlaceholder")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectForm.reason || rejectMut.isPending}>
              {rejectMut.isPending ? t("common.saving") : t("leaves.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("leaves.deleteRequest")}</AlertDialogTitle>
            <AlertDialogDescription>{t("leaves.requestDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
