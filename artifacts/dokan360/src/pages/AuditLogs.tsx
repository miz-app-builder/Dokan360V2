import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useGetAuditLogs } from "@workspace/api-client-react";
import { fadeInUp } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  ShoppingCart,
  Package,
  Boxes,
  Settings,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

const ALL_ACTIONS = [
  "login_success",
  "login_failed",
  "login_suspicious",
  "logout",
  "register",
  "token_refresh",
  "token_refresh_failed",
  "password_changed",
  "user_invited",
  "user_deactivated",
  "user_role_changed",
  "sale_created",
  "product_created",
  "product_updated",
  "product_deleted",
  "stock_adjusted",
  "settings_updated",
] as const;

type AuditAction = typeof ALL_ACTIONS[number];

function actionIcon(action: string) {
  if (action.startsWith("login") || action === "register" || action === "token_refresh" || action === "token_refresh_failed" || action === "password_changed")
    return <LogIn className="h-3.5 w-3.5" />;
  if (action === "logout")
    return <LogOut className="h-3.5 w-3.5" />;
  if (action.startsWith("sale"))
    return <ShoppingCart className="h-3.5 w-3.5" />;
  if (action.startsWith("product"))
    return <Package className="h-3.5 w-3.5" />;
  if (action === "stock_adjusted")
    return <Boxes className="h-3.5 w-3.5" />;
  if (action.startsWith("user") || action === "register")
    return <UserPlus className="h-3.5 w-3.5" />;
  if (action === "settings_updated")
    return <Settings className="h-3.5 w-3.5" />;
  return <AlertTriangle className="h-3.5 w-3.5" />;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "login_failed" || action === "login_suspicious" || action === "token_refresh_failed")
    return "destructive";
  if (action.startsWith("login") || action === "register")
    return "default";
  if (action.startsWith("sale") || action.startsWith("product") || action === "stock_adjusted")
    return "secondary";
  return "outline";
}

function metaSummary(action: string, meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const m = meta as Record<string, unknown>;
  if (action === "sale_created" && m.invoiceNumber) return `Invoice: ${m.invoiceNumber}`;
  if (action === "product_created" && m.name) return `${m.name}`;
  if (action === "product_updated" && m.productId) return `ID: ${m.productId}`;
  if (action === "product_deleted" && m.productId) return `ID: ${m.productId}`;
  if (action === "stock_adjusted") return `qty: ${m.quantity} (${m.type})`;
  if (action === "settings_updated" && Array.isArray(m.fields)) return m.fields.join(", ");
  if (action === "user_invited" && m.email) return `${m.email}`;
  if (action === "user_role_changed" && m.role) return `→ ${m.role}`;
  return "";
}

export default function AuditLogs() {
  const { t } = useTranslation();

  const [search, setSearch]   = useState("");
  const [action, setAction]   = useState("all");
  const [from, setFrom]       = useState("");
  const [to, setTo]           = useState("");
  const [page, setPage]       = useState(1);

  const { data, isLoading } = useGetAuditLogs({
    page,
    limit: 50,
    search: search || undefined,
    action: action === "all" ? undefined : action,
    from: from || undefined,
    to: to || undefined,
  });

  const reset = useCallback(() => {
    setSearch("");
    setAction("all");
    setFrom("");
    setTo("");
    setPage(1);
  }, []);

  const hasFilter = search || action !== "all" || from || to;
  const logs      = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t("auditLogs.search")}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Action filter */}
            <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("auditLogs.filterAction")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("auditLogs.allActions")}</SelectItem>
                {ALL_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {t(`auditLogs.actions.${a}`, a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* From */}
            <Input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              placeholder={t("auditLogs.from")}
              className="h-9 text-sm"
            />

            {/* To */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                placeholder={t("auditLogs.to")}
                className="h-9 text-sm flex-1"
              />
              {hasFilter && (
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={reset} title={t("auditLogs.reset")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-0 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            {pagination ? t("auditLogs.total", { count: pagination.total }) : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-xs w-[155px]">{t("auditLogs.colTime")}</TableHead>
                  <TableHead className="text-xs w-[180px]">{t("auditLogs.colAction")}</TableHead>
                  <TableHead className="text-xs">{t("auditLogs.colUser")}</TableHead>
                  <TableHead className="text-xs w-[130px] hidden md:table-cell">{t("auditLogs.colIP")}</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">{t("auditLogs.colDetail")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                      {t("auditLogs.noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const summary = metaSummary(log.action, log.meta);
                    return (
                      <TableRow key={log.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                          {format(new Date(log.createdAt), "dd/MM/yy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={actionVariant(log.action)}
                            className="gap-1.5 text-xs font-medium"
                          >
                            {actionIcon(log.action)}
                            {t(`auditLogs.actions.${log.action}`, log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">{log.user.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{t("auditLogs.system")}</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                          {log.ip ?? "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {summary || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {t("auditLogs.page", { page: pagination.page, total: pagination.totalPages })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("auditLogs.prev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("auditLogs.next")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
