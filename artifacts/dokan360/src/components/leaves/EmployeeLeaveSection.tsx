import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListLeaveRequests,
  useListLeaveBalances,
  useListLeaveTypes,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useDeleteLeaveRequest,
  getListLeaveRequestsQueryKey,
  getListLeaveBalancesQueryKey,
  type LeaveRequest,
  type LeaveStatus,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle2, XCircle, Trash2, FileText, Umbrella } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ApplyDialog, RejectDialog, CancelConfirmDialog,
  type ApplyForm,
} from "./EmployeeLeaveSectionDialogs";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<LeaveStatus, string> = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:  "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
  rejected:  "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  cancelled: "bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400",
};

const EMPTY_FORM: ApplyForm = { leaveTypeId: "", fromDate: "", toDate: "", reason: "" };

// ─── Component ────────────────────────────────────────────────────────────────

export function EmployeeLeaveSection({ employeeId }: { employeeId: number }) {
  const { t, i18n } = useTranslation();
  const { toast }   = useToast();
  const { user }    = useAuth();
  const qc          = useQueryClient();
  const isBn        = i18n.language === "bn";
  const isAdmin     = user?.role === "admin";
  const year        = new Date().getFullYear();

  const [applyOpen,    setApplyOpen]    = useState(false);
  const [form,         setForm]         = useState<ApplyForm>(EMPTY_FORM);
  const [cancelId,     setCancelId]     = useState<number | null>(null);
  const [rejectId,     setRejectId]     = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: reqData,  isLoading: loadingReq } = useListLeaveRequests({ employeeId, limit: 10, page: 1 });
  const { data: balances = [], isLoading: loadingBal } = useListLeaveBalances({ employeeId, year });
  const { data: leaveTypes = [] } = useListLeaveTypes();

  const requests    = reqData?.data ?? [];
  const activeTypes = leaveTypes.filter((lt) => lt.isActive);

  const createMut  = useCreateLeaveRequest();
  const approveMut = useApproveLeaveRequest();
  const rejectMut  = useRejectLeaveRequest();
  const deleteMut  = useDeleteLeaveRequest();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListLeaveRequestsQueryKey({ employeeId }) });
    qc.invalidateQueries({ queryKey: getListLeaveBalancesQueryKey({ employeeId, year }) });
  }

  async function handleApply() {
    if (!form.leaveTypeId || !form.fromDate || !form.toDate) return;
    try {
      await createMut.mutateAsync({
        data: { employeeId, leaveTypeId: Number(form.leaveTypeId), fromDate: form.fromDate, toDate: form.toDate, reason: form.reason || undefined },
      });
      toast({ title: t("leaves.requestSaved") });
      invalidate();
      setApplyOpen(false);
      setForm(EMPTY_FORM);
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
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
    if (!rejectId || !rejectReason) return;
    try {
      await rejectMut.mutateAsync({ id: rejectId, data: { reason: rejectReason } });
      toast({ title: t("leaves.rejected") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setRejectId(null);
      setRejectReason("");
    }
  }

  async function handleCancel() {
    if (!cancelId) return;
    try {
      await deleteMut.mutateAsync({ id: cancelId });
      toast({ title: t("leaves.cancelled") });
      invalidate();
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setCancelId(null);
    }
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/12 flex items-center justify-center">
              <Umbrella className="h-4 w-4 text-blue-500" />
            </div>
            {t("leaves.sectionTitle")}
          </CardTitle>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setApplyOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />{t("leaves.applyLeave")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Balance chips */}
        {loadingBal ? (
          <div className="flex gap-2 flex-wrap">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}
          </div>
        ) : balances.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {balances.map((b) => (
              <div
                key={b.leaveTypeId}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                style={{ borderColor: b.leaveTypeColor + "50", backgroundColor: b.leaveTypeColor + "10", color: b.leaveTypeColor }}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: b.leaveTypeColor }} />
                {isBn ? b.leaveTypeNameBn : b.leaveTypeName}
                <span className="opacity-60 mx-0.5">·</span>
                <span className="font-semibold">{b.remainingDays}</span>
                <span className="opacity-60">/{b.totalDays}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("leaves.noBalances")}</p>
        )}

        {/* Request history */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("leaves.requestHistory")}
          </p>
          {loadingReq ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : (requests as LeaveRequest[]).length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 rounded-xl border border-dashed border-border/50">
              <FileText className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">{t("leaves.noRequests")}</p>
            </div>
          ) : (
            (requests as LeaveRequest[]).map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: req.leaveTypeColor + "20", color: req.leaveTypeColor }}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: req.leaveTypeColor }}>
                    {isBn ? req.leaveTypeNameBn : req.leaveTypeName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {req.fromDate} → {req.toDate}
                    <span className="ml-1 font-medium text-foreground">({req.days}{t("leaves.days")})</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[req.status])}>
                    {t(`leaves.status.${req.status}`)}
                  </span>
                  {req.status === "pending" && isAdmin && (
                    <>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700" onClick={() => handleApprove(req.id)} title={t("leaves.approve")}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => { setRejectId(req.id); setRejectReason(""); }} title={t("leaves.reject")}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {req.status === "pending" && !isAdmin && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setCancelId(req.id)} title={t("leaves.cancelRequest")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <ApplyDialog
        open={applyOpen} onClose={() => setApplyOpen(false)}
        form={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onSave={handleApply} isSaving={createMut.isPending}
        activeTypes={activeTypes} isBn={isBn}
      />
      <RejectDialog
        open={!!rejectId} onClose={() => setRejectId(null)}
        reason={rejectReason} onReasonChange={setRejectReason}
        onReject={handleReject} isSaving={rejectMut.isPending}
      />
      <CancelConfirmDialog
        open={!!cancelId} onClose={() => setCancelId(null)}
        onConfirm={handleCancel} isSaving={deleteMut.isPending}
      />
    </Card>
  );
}
