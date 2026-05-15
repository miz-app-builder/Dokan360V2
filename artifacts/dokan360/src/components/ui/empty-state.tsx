import { ReactNode } from "react";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className ?? ""}`}
    >
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/50 flex items-center justify-center mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
