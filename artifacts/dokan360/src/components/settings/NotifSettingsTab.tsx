import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNotifSettings } from "@/hooks/use-notif-settings";
import { Bell, Save, Package, ShoppingCart, Wallet, BarChart, Mail } from "lucide-react";

interface NotifRowProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function NotifRow({ icon, label, desc, checked, onChange }: NotifRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{label}</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

export function NotifSettingsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, update } = useNotifSettings();

  function handleSave() {
    toast({ title: t("settings.notifSaved") });
  }

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl">
      <CardContent className="space-y-0 pt-2">
        <div className="divide-y divide-border/40">
          <NotifRow
            icon={<Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
            label={t("settings.notifLowStock")}
            desc={t("settings.notifLowStockDesc")}
            checked={settings.lowStock}
            onChange={(v) => update({ lowStock: v })}
          />
          <NotifRow
            icon={<ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            label={t("settings.notifNewSale")}
            desc={t("settings.notifNewSaleDesc")}
            checked={settings.newSale}
            onChange={(v) => update({ newSale: v })}
          />
          <NotifRow
            icon={<Wallet className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
            label={t("settings.notifDueAlert")}
            desc={t("settings.notifDueAlertDesc")}
            checked={settings.dueAlert}
            onChange={(v) => update({ dueAlert: v })}
          />
          <NotifRow
            icon={<BarChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            label={t("settings.notifDailyReport")}
            desc={t("settings.notifDailyReportDesc")}
            checked={settings.dailyReport}
            onChange={(v) => update({ dailyReport: v })}
          />
          <NotifRow
            icon={<Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
            label={t("settings.notifEmail")}
            desc={t("settings.notifEmailDesc")}
            checked={settings.email}
            onChange={(v) => update({ email: v })}
          />
        </div>

        <Button className="w-full h-11 rounded-xl gap-2 mt-4" onClick={handleSave}>
          <Save className="h-4 w-4" />
          {t("settings.saveNotifSettings")}
        </Button>
      </CardContent>
    </Card>
  );
}
