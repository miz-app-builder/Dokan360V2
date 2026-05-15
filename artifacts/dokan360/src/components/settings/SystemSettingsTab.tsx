import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/use-system-settings";
import { Globe, Save, Clock, Calendar, DollarSign, AlertTriangle } from "lucide-react";

const TIMEZONES = [
  { value: "Asia/Dhaka",     label: "Asia/Dhaka (BST +6:00)" },
  { value: "Asia/Kolkata",   label: "Asia/Kolkata (IST +5:30)" },
  { value: "Asia/Karachi",   label: "Asia/Karachi (PKT +5:00)" },
  { value: "UTC",            label: "UTC (±0:00)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/01/2025)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (01/31/2025)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-01-31)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-01-2025)" },
];

const CURRENCIES = [
  { value: "BDT", label: "BDT — Bangladeshi Taka (৳)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "INR", label: "INR — Indian Rupee (₹)" },
];

export function SystemSettingsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, update } = useSystemSettings();

  function handleSave() {
    toast({ title: t("settings.sysSaved") });
  }

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl">
      <CardContent className="space-y-4 pt-5">
        {/* Default language */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.sysLang")}
          </Label>
          <Select value={settings.language} onValueChange={(v) => update({ language: v as "bn" | "en" })}>
            <SelectTrigger className="h-10 rounded-xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="bn">বাংলা</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.sysTimezone")}
          </Label>
          <Select value={settings.timezone} onValueChange={(v) => update({ timezone: v })}>
            <SelectTrigger className="h-10 rounded-xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date format */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.sysDateFormat")}
          </Label>
          <Select value={settings.dateFormat} onValueChange={(v) => update({ dateFormat: v })}>
            <SelectTrigger className="h-10 rounded-xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {DATE_FORMATS.map((df) => (
                <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.sysCurrency")}
          </Label>
          <Select value={settings.currency} onValueChange={(v) => update({ currency: v })}>
            <SelectTrigger className="h-10 rounded-xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Low stock threshold */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.sysLowStockThreshold")}
          </Label>
          <Input
            type="number"
            min={1}
            max={100}
            className="h-10 rounded-xl border-border/70"
            value={settings.lowStockThreshold}
            onChange={(e) => update({ lowStockThreshold: parseInt(e.target.value, 10) || 5 })}
          />
          <p className="text-[11px] text-muted-foreground">{t("settings.sysLowStockThresholdHint")}</p>
        </div>

        <Button className="w-full h-11 rounded-xl gap-2 mt-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          {t("settings.saveSystemSettings")}
        </Button>
      </CardContent>
    </Card>
  );
}
