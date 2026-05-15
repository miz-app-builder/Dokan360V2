import { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, children, icon }: PageHeaderProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 text-primary">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </motion.div>
  );
}
