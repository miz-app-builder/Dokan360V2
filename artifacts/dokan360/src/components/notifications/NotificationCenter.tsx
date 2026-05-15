import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Check, CheckCheck, Trash2, Package, Users, ShoppingCart, Info, Umbrella } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useListNotifications,
  useGetNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  getListNotificationsQueryKey,
  getGetNotificationCountQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
  entityType?: string | null;
};

const TYPE_ICONS: Record<string, typeof Bell> = {
  low_stock:      Package,
  due_alert:      Users,
  sale_alert:     ShoppingCart,
  leave_approved: Umbrella,
  leave_rejected: Umbrella,
  system:         Info,
};

const TYPE_COLORS: Record<string, string> = {
  low_stock:      "text-orange-500",
  due_alert:      "text-red-500",
  sale_alert:     "text-emerald-500",
  leave_approved: "text-green-500",
  leave_rejected: "text-red-500",
  system:         "text-blue-500",
};

function localizeText(text: string | null | undefined, lang: string): string {
  if (!text) return "";
  try {
    const parsed = JSON.parse(text) as { bn?: string; en?: string };
    if (parsed && typeof parsed === "object" && (parsed.bn || parsed.en)) {
      return (lang === "bn" ? parsed.bn : parsed.en) ?? parsed.bn ?? parsed.en ?? text;
    }
  } catch {
    // plain text — return as-is
  }
  return text;
}

function timeAgo(iso: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notifications.justNow");
  if (mins < 60) return t("notifications.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notifications.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  return t("notifications.daysAgo", { count: days });
}

export function NotificationCenter() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: countData } = useGetNotificationCount({
    query: {
      queryKey: getGetNotificationCountQueryKey(),
      refetchInterval: 60_000,
    },
  });

  const { data: notifications, isLoading } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      enabled: open,
    },
  });

  const { mutate: markRead } = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNotificationCountQueryKey() });
      },
    },
  });

  const { mutate: markAllRead } = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNotificationCountQueryKey() });
      },
    },
  });

  const { mutate: deleteNotif } = useDeleteNotification({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetNotificationCountQueryKey() });
      },
    },
  });

  const unreadCount = countData?.count ?? 0;
  const items = (notifications as NotificationItem[] | undefined) ?? [];

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetNotificationCountQueryKey() });
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl relative hover:bg-muted/60"
          title={t("notifications.title")}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 flex items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 rounded-2xl shadow-xl border-border/60"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">{t("notifications.title")}</span>
            {unreadCount > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-destructive/10 text-destructive border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <BellOff className="h-8 w-8 opacity-30" />
              <p className="text-sm">{t("notifications.empty")}</p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="divide-y divide-border/30">
              {items.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Info;
                const iconColor = TYPE_COLORS[n.type] ?? "text-muted-foreground";
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors cursor-pointer",
                      !n.isRead && "bg-primary/5",
                    )}
                    onClick={() => !n.isRead && markRead({ id: n.id })}
                  >
                    <div className={cn("h-8 w-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 mt-0.5", iconColor)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-sm leading-tight", !n.isRead && "font-semibold")}>
                          {localizeText(n.title, i18n.language)}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.isRead && (
                            <button
                              className="h-5 w-5 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); markRead({ id: n.id }); }}
                              title={t("notifications.markRead")}
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            className="h-5 w-5 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteNotif({ id: n.id }); }}
                            title={t("notifications.delete")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                          {localizeText(n.body, i18n.language)}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(n.createdAt, t)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <>
            <Separator className="bg-border/40" />
            <div className="px-4 py-2.5 text-center">
              <p className="text-xs text-muted-foreground">
                {t("notifications.total", { count: items.length })}
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
