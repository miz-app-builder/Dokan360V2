import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetShop,
  useUpdateShop,
  useListShopUsers,
  useUpdateShopUser,
  getGetShopQueryKey,
  getListShopUsersQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { fadeInUp } from "@/lib/motion";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { usePrinterSettings } from "@/hooks/use-printer-settings";
import { Store, Users, Save, ShieldCheck, Eye, ShoppingBag, UserX, UserCheck, Globe, Mail, Receipt, Image, Percent, Upload, Link2, X, Loader2, Printer, Building2, Clock, Copy, Bell, ChevronRight, ArrowLeft } from "lucide-react";
import { RolePermissionsTab } from "@/components/settings/RolePermissionsTab";
import { SystemSettingsTab }   from "@/components/settings/SystemSettingsTab";
import { NotifSettingsTab }    from "@/components/settings/NotifSettingsTab";
import { UserAccessTab }       from "@/components/settings/UserAccessTab";

/* ─── Role badge ─────────────────────────────────────────────── */
const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-0",
  seller: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-0",
  viewer: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-0",
};
const ROLE_ICONS: Record<string, typeof ShieldCheck> = {
  admin:  ShieldCheck,
  seller: ShoppingBag,
  viewer: Eye,
};

/* ─── Shop Info Tab ──────────────────────────────────────────── */
function ShopInfoTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: shop, isLoading } = useGetShop({ query: { queryKey: getGetShopQueryKey() } });
  const { mutate: updateShop, isPending } = useUpdateShop({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetShopQueryKey() });
        toast({ title: t("settings.shopUpdated") });
      },
      onError: () => toast({ title: t("settings.shopUpdateFailed"), variant: "destructive" }),
    },
  });

  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [address, setAddress]         = useState("");
  const [email, setEmail]             = useState("");
  const [website, setWebsite]         = useState("");
  const [taxNumber, setTaxNumber]     = useState("");
  const [taxRate, setTaxRate]         = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [logo, setLogo]               = useState("");
  const [activeTab, setActiveTab]     = useState("basic");
  const [uploading, setUploading]     = useState(false);
  const [urlMode, setUrlMode]         = useState(false);

  useEffect(() => {
    if (shop) {
      setName(shop.name ?? "");
      setPhone(shop.phone ?? "");
      setAddress(shop.address ?? "");
      setEmail((shop as any).email ?? "");
      setWebsite((shop as any).website ?? "");
      setTaxNumber((shop as any).taxNumber ?? "");
      setTaxRate(String((shop as any).taxRate ?? "0"));
      setInvoicePrefix((shop as any).invoicePrefix ?? "INV");
      setInvoiceNote((shop as any).invoiceNote ?? "");
      setLogo((shop as any).logo ?? "");
    }
  }, [shop]);

  async function handleLogoUpload(file: File) {
    if (!user?.shopId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("settings.logoUploadFailed") + " (সর্বোচ্চ ২ MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${user.shopId}/logo.${ext}`;
      const { error } = await supabase.storage
        .from("shop-logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("shop-logos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      setLogo(publicUrl);
      setUrlMode(false);
      toast({ title: t("settings.logoUploaded") });
    } catch (err: any) {
      toast({ title: t("settings.logoUploadFailed") + ": " + (err.message ?? ""), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    if (!name.trim()) {
      toast({ title: t("settings.shopNameRequired"), variant: "destructive" });
      return;
    }
    updateShop({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        email: email || null,
        website: website || null,
        taxNumber: taxNumber || null,
        taxRate: taxRate ? Number(taxRate) : 0,
        invoicePrefix: invoicePrefix || "INV",
        invoiceNote: invoiceNote || null,
        logo: logo || null,
      } as any,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl">
      <CardContent className="space-y-4 pt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-xl h-9 bg-muted/60 border border-border/50 mb-4 w-full">
            <TabsTrigger value="basic" className="flex-1 rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Store className="h-3.5 w-3.5" />{t("settings.shopInfo")}
            </TabsTrigger>
            <TabsTrigger value="company" className="flex-1 rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Globe className="h-3.5 w-3.5" />{t("settings.companyTab")}
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex-1 rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Receipt className="h-3.5 w-3.5" />{t("settings.invoiceTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-3 mt-0">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("settings.shopName")} *</Label>
              <Input className="h-10 rounded-xl border-border/70" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.shopName")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("settings.shopPhone")}</Label>
              <Input className="h-10 rounded-xl border-border/70" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("settings.shopAddress")}</Label>
              <Input className="h-10 rounded-xl border-border/70" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("settings.shopAddress")} />
            </div>
          </TabsContent>

          <TabsContent value="company" className="space-y-3 mt-0">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{t("settings.shopEmail")}</Label>
              <Input className="h-10 rounded-xl border-border/70" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="shop@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{t("settings.shopWebsite")}</Label>
              <Input className="h-10 rounded-xl border-border/70" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{t("settings.taxNumber")}</Label>
                <Input className="h-10 rounded-xl border-border/70" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder="TIN/VAT নম্বর" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-muted-foreground" />{t("settings.taxRate")}</Label>
                <Input className="h-10 rounded-xl border-border/70" type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
              </div>
            </div>
            {/* ─── Logo section ────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Image className="h-3.5 w-3.5 text-muted-foreground" />
                {t("settings.logo")}
              </Label>

              {/* Preview + clear */}
              {logo && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/20">
                  <img
                    src={logo}
                    alt="logo preview"
                    className="h-14 w-14 rounded-lg object-contain border border-border/50 bg-white p-1 shrink-0"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{logo}</p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => { setLogo(""); setUrlMode(false); }}
                    title={t("settings.logoRemove")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Upload button (primary action) */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                  e.target.value = "";
                }}
              />

              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-5 cursor-pointer hover:bg-muted/20 hover:border-primary/40 transition-colors"
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">
                  {uploading ? t("settings.logoUploading") : t("settings.logoUpload")}
                </p>
                <p className="text-[11px] text-muted-foreground">{t("settings.logoUploadHint")}</p>
              </div>

              {/* URL mode toggle */}
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setUrlMode((v) => !v)}
              >
                <Link2 className="h-3 w-3" />
                {urlMode ? t("settings.logoHint") : t("settings.logoOrUrl")}
              </button>

              {urlMode && (
                <div className="space-y-1">
                  <Input
                    className="h-10 rounded-xl border-border/70"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-[11px] text-muted-foreground">{t("settings.logoHint")}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-3 mt-0">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("settings.invoicePrefix")}</Label>
              <Input className="h-10 rounded-xl border-border/70" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} placeholder="INV" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">{t("settings.invoiceNote")}</Label>
              <Input className="h-10 rounded-xl border-border/70" value={invoiceNote} onChange={(e) => setInvoiceNote(e.target.value)} placeholder={t("settings.invoiceNoteHint")} />
              <p className="text-[11px] text-muted-foreground">{t("settings.invoiceNoteHint")}</p>
            </div>
          </TabsContent>
        </Tabs>

        <Button className="w-full h-11 rounded-xl gap-2 mt-2" onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? t("settings.saving") : t("settings.saveShopInfo")}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── User Management Tab ────────────────────────────────────── */
type ShopUser = { id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string };

function UserManagementTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: self } = useAuth();
  const qc = useQueryClient();

  const [deactivateTarget, setDeactivateTarget] = useState<ShopUser | null>(null);
  const [activateTarget, setActivateTarget] = useState<ShopUser | null>(null);

  const { data: users, isLoading } = useListShopUsers({
    query: { queryKey: getListShopUsersQueryKey() },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListShopUsersQueryKey() });

  const { mutate: deactivateUser } = useUpdateShopUser({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: t("settings.deactivateSuccess") }); },
      onError: () => toast({ title: t("settings.deactivateError"), variant: "destructive" }),
    },
  });

  const { mutate: activateUser } = useUpdateShopUser({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: t("settings.activateSuccess") }); },
      onError: () => toast({ title: t("settings.deactivateError"), variant: "destructive" }),
    },
  });

  const { mutate: changeRole } = useUpdateShopUser({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: t("settings.roleChanged") }); },
      onError: () => toast({ title: t("settings.roleChangeError"), variant: "destructive" }),
    },
  });

  const roleLabels: Record<string, string> = {
    admin:  t("settings.roleAdmin"),
    seller: t("settings.roleSeller"),
    viewer: t("settings.roleViewer"),
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          {isLoading && (
            <div className="space-y-2.5 p-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          )}
          {!isLoading && (!users || users.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-10">{t("settings.noUsers")}</p>
          )}
          {!isLoading && users && users.length > 0 && (
            <div className="divide-y divide-border/40">
              {(users as ShopUser[]).map((u) => {
                const RoleIcon = ROLE_ICONS[u.role] ?? Eye;
                const initials = u.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                const isSelf = u.id === self?.id;
                return (
                  <div key={u.id} className={`flex items-center gap-3 px-4 py-3.5 transition-opacity ${!u.isActive ? "opacity-55" : ""}`}>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{u.name}</p>
                        {isSelf && (
                          <Badge className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-0">
                            {t("settings.you")}
                          </Badge>
                        )}
                        {!u.isActive && (
                          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                            {t("common.inactive")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{u.email}</p>
                    </div>

                    {!isSelf ? (
                      <Select
                        value={u.role}
                        onValueChange={(newRole) =>
                          changeRole({ id: u.id, data: { role: newRole as "admin" | "seller" | "viewer" } })
                        }
                        disabled={!u.isActive}
                      >
                        <SelectTrigger className="h-7 w-[108px] rounded-lg border-border/60 text-xs gap-1 shrink-0 px-2">
                          <RoleIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="admin" className="text-xs">{t("settings.roleAdmin")}</SelectItem>
                          <SelectItem value="seller" className="text-xs">{t("settings.roleSeller")}</SelectItem>
                          <SelectItem value="viewer" className="text-xs">{t("settings.roleViewer")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`text-[10px] h-5 px-1.5 flex items-center gap-1 shrink-0 ${ROLE_COLORS[u.role] ?? ""}`}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        {roleLabels[u.role] ?? u.role}
                      </Badge>
                    )}

                    {!isSelf && u.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title={t("settings.deactivate")}
                        onClick={() => setDeactivateTarget(u)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                    {!isSelf && !u.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl shrink-0 hover:bg-green-500/10 hover:text-green-600 transition-colors"
                        title={t("settings.activate")}
                        onClick={() => setActivateTarget(u)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deactivate")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.deactivateConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deactivateTarget) {
                  deactivateUser({ id: deactivateTarget.id, data: { isActive: false } });
                  setDeactivateTarget(null);
                }
              }}
            >
              {t("settings.deactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!activateTarget} onOpenChange={(open) => !open && setActivateTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.activate")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.activateConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (activateTarget) {
                  activateUser({ id: activateTarget.id, data: { isActive: true } });
                  setActivateTarget(null);
                }
              }}
            >
              {t("settings.activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Printer Settings Tab ───────────────────────────────────── */
function PrinterSettingsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { settings, update } = usePrinterSettings();

  const [paperSize, setPaperSize] = useState(settings.paperSize);
  const [autoPrint, setAutoPrint] = useState(settings.autoPrint);
  const [copies,    setCopies]    = useState<1 | 2 | 3>(settings.copies);

  function handleSave() {
    update({ paperSize, autoPrint, copies });
    toast({ title: t("settings.printerSaved") });
  }

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl">
      <CardContent className="space-y-5 pt-5">

        {/* Paper size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("settings.paperSize")}</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["58mm", "80mm"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPaperSize(size)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paperSize === size
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <div className={`rounded border-2 flex items-center justify-center ${
                  size === "58mm" ? "h-10 w-7" : "h-10 w-9"
                } ${paperSize === size ? "border-primary" : "border-border"}`}>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold">{size}</span>
                <span className="text-[11px] text-muted-foreground">
                  {size === "58mm" ? t("settings.paperSize58").split("(")[1]?.replace(")", "") ?? "ছোট" : t("settings.paperSize80").split("(")[1]?.replace(")", "") ?? "বড়"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Copies */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("settings.copies")}</Label>
          <Select
            value={String(copies)}
            onValueChange={(v) => setCopies(Number(v) as 1 | 2 | 3)}
          >
            <SelectTrigger className="h-10 rounded-xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1">{t("settings.copy1")}</SelectItem>
              <SelectItem value="2">{t("settings.copy2")}</SelectItem>
              <SelectItem value="3">{t("settings.copy3")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-print toggle */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium cursor-pointer">{t("settings.autoPrint")}</Label>
            <p className="text-[11px] text-muted-foreground">{t("settings.autoPrintDesc")}</p>
          </div>
          <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
        </div>

        <Button className="w-full h-11 rounded-xl gap-2 mt-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          {t("settings.savePrinterSettings")}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Outlet Settings Tab ────────────────────────────────────── */
const OUTLET_KEY = "dokan360_outlet_settings";

interface OutletConfig {
  outletCode:  string;
  openingTime: string;
  closingTime: string;
  closedDay:   string;
}

function loadOutlet(): OutletConfig {
  try {
    const raw = localStorage.getItem(OUTLET_KEY);
    if (!raw) return { outletCode: "MAIN", openingTime: "09:00", closingTime: "22:00", closedDay: "none" };
    return JSON.parse(raw);
  } catch {
    return { outletCode: "MAIN", openingTime: "09:00", closingTime: "22:00", closedDay: "none" };
  }
}

function OutletSettingsTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: shop } = useGetShop({ query: { queryKey: getGetShopQueryKey() } });

  const [cfg, setCfg]   = useState<OutletConfig>(loadOutlet);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    localStorage.setItem(OUTLET_KEY, JSON.stringify(cfg));
    setTimeout(() => {
      setSaving(false);
      toast({ title: t("settings.outletSaved") });
    }, 300);
  }

  return (
    <Card className="border-border/60 shadow-sm rounded-2xl">
      <CardContent className="space-y-4 pt-5">

        {/* Read-only shop name */}
        {shop && (
          <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 flex items-center gap-3">
            <Store className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("settings.shopName")}</p>
              <p className="text-sm font-semibold">{shop.name}</p>
            </div>
            {(shop as any).currency && (
              <Badge className="ml-auto text-[11px] h-5 px-2 bg-primary/10 text-primary border-0">
                {(shop as any).currency}
              </Badge>
            )}
          </div>
        )}

        {/* Outlet code */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("settings.outletCode")}</Label>
          <Input
            className="h-10 rounded-xl border-border/70 font-mono uppercase"
            value={cfg.outletCode}
            onChange={(e) => setCfg((p) => ({ ...p, outletCode: e.target.value.toUpperCase() }))}
            placeholder={t("settings.outletCodeHint")}
            maxLength={20}
          />
          <p className="text-[11px] text-muted-foreground">{t("settings.outletCodeHint")}</p>
        </div>

        {/* Opening & closing time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {t("settings.openingTime")}
            </Label>
            <Input
              className="h-10 rounded-xl border-border/70"
              type="time"
              value={cfg.openingTime}
              onChange={(e) => setCfg((p) => ({ ...p, openingTime: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {t("settings.closingTime")}
            </Label>
            <Input
              className="h-10 rounded-xl border-border/70"
              type="time"
              value={cfg.closingTime}
              onChange={(e) => setCfg((p) => ({ ...p, closingTime: e.target.value }))}
            />
          </div>
        </div>

        {/* Weekly closing day */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t("settings.closedDay")}</Label>
          <Select value={cfg.closedDay} onValueChange={(v) => setCfg((p) => ({ ...p, closedDay: v }))}>
            <SelectTrigger className="h-10 rounded-xl border-border/70">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="none">{t("settings.closedDayNone")}</SelectItem>
              <SelectItem value="friday">{t("settings.closedDayFriday")}</SelectItem>
              <SelectItem value="saturday">{t("settings.closedDaySaturday")}</SelectItem>
              <SelectItem value="sunday">{t("settings.closedDaySunday")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full h-11 rounded-xl gap-2 mt-2" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? t("settings.saving") : t("settings.saveOutletSettings")}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Roles & Access Wrapper ─────────────────────────────────── */
function RolesAndAccessPanel() {
  const { t }               = useTranslation();
  const [subTab, setSubTab] = useState<"roles" | "access">("roles");

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40 w-fit shrink-0">
        <button
          type="button"
          onClick={() => setSubTab("roles")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            subTab === "roles"
              ? "bg-card text-foreground shadow-sm border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("settings.rolePermTab")}
        </button>
        <button
          type="button"
          onClick={() => setSubTab("access")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            subTab === "access"
              ? "bg-card text-foreground shadow-sm border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("settings.userAccessTab")}
        </button>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 min-h-0">
        {subTab === "roles"  && <RolePermissionsTab />}
        {subTab === "access" && <UserAccessTab />}
      </div>
    </div>
  );
}

/* ─── Settings content map ───────────────────────────────────── */
function SettingsContent({ active, isAdmin }: { active: string; isAdmin: boolean }) {
  if (active === "shop"    && isAdmin) return <ShopInfoTab />;
  if (active === "users")              return <UserManagementTab />;
  if (active === "printer" && isAdmin) return <PrinterSettingsTab />;
  if (active === "outlet"  && isAdmin) return <OutletSettingsTab />;
  if (active === "roles"   && isAdmin) return <RolesAndAccessPanel />;
  if (active === "system"  && isAdmin) return <SystemSettingsTab />;
  if (active === "notif")              return <NotifSettingsTab />;
  return null;
}

/* ─── Main Settings Page ─────────────────────────────────────── */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const allTabs = useMemo(() => [
    { value: "shop",    icon: Store,       labelKey: "settings.shopInfo",         adminOnly: true,  descKey: "settings.shopInfoDesc" },
    { value: "users",   icon: Users,       labelKey: "settings.userManagement",   adminOnly: false, descKey: "settings.userManagementDesc" },
    { value: "printer", icon: Printer,     labelKey: "settings.printerTab",       adminOnly: true,  descKey: "settings.printerSettingsDesc" },
    { value: "outlet",  icon: Building2,   labelKey: "settings.outletTab",        adminOnly: true,  descKey: "settings.outletSettingsDesc" },
    { value: "roles",   icon: ShieldCheck, labelKey: "settings.roleSettingsTab",  adminOnly: true,  descKey: "settings.rolePermissionsDesc" },
    { value: "system",  icon: Globe,       labelKey: "settings.systemSettingsTab",adminOnly: true,  descKey: "settings.systemSettingsDesc" },
    { value: "notif",   icon: Bell,        labelKey: "settings.notifSettingsTab", adminOnly: false, descKey: "settings.notifSettingsDesc" },
  ], []);

  const tabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);
  const defaultTab = tabs[0]?.value ?? "users";

  const [active, setActive] = useState(defaultTab);
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const activeTab = tabs.find(t => t.value === active);
  const { setSubtitle } = usePageSubtitle();

  useEffect(() => {
    if (activeTab) setSubtitle(t(activeTab.labelKey));
    return () => setSubtitle(null);
  }, [active, activeTab, setSubtitle, t]);

  function selectTab(value: string) {
    setActive(value);
    setMobileShowContent(true);
  }

  return (
    <motion.div
      initial="hidden" animate="visible" variants={fadeInUp}
      className="max-w-screen-2xl mx-auto h-full flex flex-col"
    >

      {/* ── Two-panel layout ── */}
      <div className="flex flex-col md:flex-row gap-0 rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex-1 min-h-0">

        {/* ── Left nav panel ─────────────────────────────── */}
        {/* Mobile: show when mobileShowContent is false */}
        {/* Desktop: always visible */}
        <nav className={`
          md:flex flex-col w-full md:w-60 lg:w-64 shrink-0
          border-b md:border-b-0 md:border-r border-border/50
          bg-muted/20 md:bg-muted/10
          ${mobileShowContent ? "hidden" : "flex"}
        `}>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 pt-2">
            {tabs.map(({ value, icon: Icon, labelKey, descKey }) => {
              const isActive = active === value;
              return (
                <button
                  key={value}
                  onClick={() => selectTab(value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                      {t(labelKey)}
                    </p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                    isActive ? "text-primary translate-x-0.5" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                  }`} />
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── Right content panel ─────────────────────────── */}
        {/* Mobile: show when mobileShowContent is true */}
        {/* Desktop: always visible */}
        <div className={`
          md:flex flex-col flex-1 min-w-0
          ${mobileShowContent ? "flex" : "hidden"}
        `}>
          {/* Mobile back button only */}
          {mobileShowContent && (
            <div className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-border/40 shrink-0">
              <button
                onClick={() => setMobileShowContent(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {activeTab && (
                <p className="text-sm font-semibold text-foreground">{t(activeTab.labelKey)}</p>
              )}
            </div>
          )}

          {/* Content body */}
          <div className="flex-1 overflow-auto p-4 md:p-5">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <SettingsContent active={active} isAdmin={isAdmin} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
