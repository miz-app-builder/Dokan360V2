import { useTranslation } from "react-i18next";
import type { LeaveType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplyForm = { leaveTypeId: string; fromDate: string; toDate: string; reason: string };

type ApplyDialogProps = {
  open: boolean; onClose: () => void; form: ApplyForm;
  onChange: (patch: Partial<ApplyForm>) => void; onSave: () => void;
  isSaving: boolean; activeTypes: LeaveType[]; isBn: boolean;
};

type RejectDialogProps = {
  open: boolean; onClose: () => void;
  reason: string; onReasonChange: (v: string) => void;
  onReject: () => void; isSaving: boolean;
};

type CancelDialogProps = {
  open: boolean; onClose: () => void;
  onConfirm: () => void; isSaving: boolean;
};

// ─── Components ───────────────────────────────────────────────────────────────

export function ApplyDialog({ open, onClose, form, onChange, onSave, isSaving, activeTypes, isBn }: ApplyDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("leaves.applyLeave")}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("leaves.type")} *</Label>
            <Select value={form.leaveTypeId} onValueChange={(v) => onChange({ leaveTypeId: v })}>
              <SelectTrigger><SelectValue placeholder={t("leaves.selectType")} /></SelectTrigger>
              <SelectContent>
                {activeTypes.map((lt) => (
                  <SelectItem key={lt.id} value={String(lt.id)}>
                    {isBn ? lt.nameBn : lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("leaves.fromDate")} *</Label>
              <Input type="date" value={form.fromDate} onChange={(e) => onChange({ fromDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("leaves.toDate")} *</Label>
              <Input type="date" value={form.toDate} min={form.fromDate} onChange={(e) => onChange({ toDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("leaves.reason")}</Label>
            <Textarea rows={2} value={form.reason} onChange={(e) => onChange({ reason: e.target.value })} placeholder={t("leaves.reasonPlaceholder")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onSave} disabled={isSaving || !form.leaveTypeId || !form.fromDate || !form.toDate}>
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectDialog({ open, onClose, reason, onReasonChange, onReject, isSaving }: RejectDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{t("leaves.reject")}</DialogTitle></DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label className="text-xs">{t("leaves.rejectReason")} *</Label>
          <Textarea rows={3} value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder={t("leaves.rejectReasonPlaceholder")} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={onReject} disabled={!reason || isSaving}>
            {isSaving ? t("common.saving") : t("leaves.reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CancelConfirmDialog({ open, onClose, onConfirm, isSaving }: CancelDialogProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("leaves.cancelRequest")}</AlertDialogTitle>
          <AlertDialogDescription>{t("leaves.cancelConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.no")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isSaving ? t("common.saving") : t("leaves.cancelRequest")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
