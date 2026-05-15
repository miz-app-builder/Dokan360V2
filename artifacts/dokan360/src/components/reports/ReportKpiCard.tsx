import type { LucideIcon } from "lucide-react";

interface ReportKpiCardProps {
  icon:      LucideIcon;
  label:     string;
  value:     string;
  subLabel?: string;
  variant?:  "default" | "success" | "warning" | "danger";
}

const VARIANTS = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger:  "bg-destructive/10 text-destructive",
};

export function ReportKpiCard({
  icon: Icon,
  label,
  value,
  subLabel,
  variant = "default",
}: ReportKpiCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${VARIANTS[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">{value}</p>
      {subLabel && <p className="mt-0.5 text-xs text-muted-foreground">{subLabel}</p>}
    </div>
  );
}
