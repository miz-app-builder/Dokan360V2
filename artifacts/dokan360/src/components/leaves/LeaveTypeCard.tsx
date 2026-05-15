import { useTranslation } from "react-i18next";
import type { LeaveType } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Banknote, BanknoteX } from "lucide-react";

type Props = {
  lt:       LeaveType;
  onEdit:   (lt: LeaveType) => void;
  onDelete: (lt: LeaveType) => void;
};

export function LeaveTypeCard({ lt, onEdit, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const displayName = i18n.language === "bn" ? lt.nameBn : lt.name;

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: lt.color }} />
      <CardContent className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: lt.color + "20", color: lt.color }}
            >
              {lt.isPaid ? <Banknote className="h-4 w-4" /> : <BanknoteX className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => onEdit(lt)}
              title={lt.isDefault ? t("leaves.customizeType") : t("leaves.editType")}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(lt)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {lt.defaultDays} {t("leaves.daysPerYear")}
          </span>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {lt.isDefault && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0 border-violet-300 text-violet-600 dark:text-violet-400"
              >
                {lt.isOverridden ? t("leaves.badgeCustomized") : t("leaves.badgeDefault")}
              </Badge>
            )}
            <Badge variant={lt.isPaid ? "default" : "secondary"} className="text-xs px-1.5 py-0">
              {lt.isPaid ? t("leaves.paid") : t("leaves.unpaid")}
            </Badge>
            <Badge variant={lt.isActive ? "default" : "secondary"} className="text-xs px-1.5 py-0">
              {lt.isActive ? t("schedule.active") : t("schedule.inactive")}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
