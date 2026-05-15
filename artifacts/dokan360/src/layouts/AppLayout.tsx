import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { usePageSubtitle } from "@/contexts/PageSubtitleContext";
import { supabase } from "@/lib/supabase";
import { ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  FileText,
  BarChart,
  Settings,
  LogOut,
  Store,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  Menu,
  Truck,
  ShoppingBag,
  ShieldCheck,
  UserCog,
  CalendarCheck,
  CalendarDays,
  Umbrella,
  Banknote,
  GraduationCap,
  BarChart2,
} from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { fadeIn } from "@/lib/motion";

/* ─── Nav definitions ────────────────────────────────────────── */
/* ─── Page metadata (icon, colors, subtitle) ─────────────────
 *  New page ekta add korte hle sudhu ei array-e ekta entry dao.
 *  Topbar automatically oi page-er icon + title + subtitle dekhabe.
 * ─────────────────────────────────────────────────────────── */
const NAV_KEYS = [
  { href: "/",           key: "nav.dashboard",  icon: LayoutDashboard, subtitleKey: "dashboard.subtitle",  iconBg: "bg-primary/15",     iconText: "text-primary" },
  { href: "/pos",        key: "nav.pos",        icon: ShoppingCart,    subtitleKey: "pos.subtitle",        iconBg: "bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
  { href: "/sales",      key: "nav.sales",      icon: FileText,        subtitleKey: "sales.subtitle",      iconBg: "bg-orange-500/15",  iconText: "text-orange-600 dark:text-orange-400" },
  { href: "/products",   key: "nav.products",   icon: Package,         subtitleKey: "products.subtitle",   iconBg: "bg-primary/15",     iconText: "text-primary" },
  { href: "/inventory",  key: "nav.inventory",  icon: Boxes,           subtitleKey: "inventory.subtitle",  iconBg: "bg-violet-500/15",  iconText: "text-violet-600 dark:text-violet-400" },
  { href: "/customers",  key: "nav.customers",  icon: Users,           subtitleKey: "customers.subtitle",  iconBg: "bg-blue-500/15",    iconText: "text-blue-600 dark:text-blue-400" },
  { href: "/suppliers",  key: "nav.suppliers",  icon: Truck,           subtitleKey: "suppliers.subtitle",  iconBg: "bg-blue-500/15",    iconText: "text-blue-600 dark:text-blue-400" },
  { href: "/purchases",  key: "nav.purchases",  icon: ShoppingBag,     subtitleKey: "purchases.subtitle",  iconBg: "bg-violet-500/15",  iconText: "text-violet-600 dark:text-violet-400" },
  { href: "/reports",    key: "nav.reports",    icon: BarChart,        subtitleKey: "reports.subtitle",    iconBg: "bg-cyan-500/15",    iconText: "text-cyan-600 dark:text-cyan-400" },
  { href: "/employees",  key: "nav.employees",  icon: UserCog,         subtitleKey: "employees.subtitle",   iconBg: "bg-indigo-500/15",  iconText: "text-indigo-600 dark:text-indigo-400" },
  { href: "/attendance", key: "nav.attendance", icon: CalendarCheck,   subtitleKey: "attendance.subtitle",  iconBg: "bg-teal-500/15",    iconText: "text-teal-600 dark:text-teal-400" },
  { href: "/schedule",   key: "nav.schedule",   icon: CalendarDays,    subtitleKey: "schedule.subtitle",    iconBg: "bg-amber-500/15",   iconText: "text-amber-600 dark:text-amber-400" },
  { href: "/leaves",     key: "nav.leaves",     icon: Umbrella,        subtitleKey: "leaves.subtitle",      iconBg: "bg-emerald-500/15", iconText: "text-emerald-600 dark:text-emerald-400" },
  { href: "/payroll",       key: "nav.payroll",       icon: Banknote,       subtitleKey: "payroll.subtitle",      iconBg: "bg-yellow-500/15",  iconText: "text-yellow-600 dark:text-yellow-400" },
  { href: "/salary-grades",  key: "nav.salaryGrades",  icon: GraduationCap, subtitleKey: "salaryGrades.subtitle",  iconBg: "bg-lime-500/15",    iconText: "text-lime-600 dark:text-lime-400" },
  { href: "/hr-analytics",   key: "nav.hrAnalytics",   icon: BarChart2,     subtitleKey: "hrAnalytics.subtitle",   iconBg: "bg-violet-500/15",  iconText: "text-violet-600 dark:text-violet-400" },
  { href: "/audit-logs",    key: "nav.auditLogs",    icon: ShieldCheck,    subtitleKey: "auditLogs.subtitle",    iconBg: "bg-slate-500/15",   iconText: "text-slate-600 dark:text-slate-400" },
  { href: "/settings",   key: "nav.settings",   icon: Settings,        subtitleKey: "settings.subtitle",   iconBg: "bg-slate-500/15",   iconText: "text-slate-600 dark:text-slate-400" },
];

const BOTTOM_NAV_KEYS = [
  { href: "/",          key: "nav.home",      icon: LayoutDashboard },
  { href: "/pos",       key: "nav.pos",       icon: ShoppingCart },
  { href: "/products",  key: "nav.products",  icon: Package },
  { href: "/customers", key: "nav.customers", icon: Users },
];

function isActive(href: string, location: string) {
  return href === "/" ? location === "/" : location.startsWith(href);
}

/* ─── Theme Toggle ───────────────────────────────────────────── */
function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const icon =
    theme === "dark"  ? <Moon    className="h-4 w-4" /> :
    theme === "light" ? <Sun     className="h-4 w-4" /> :
                        <Monitor className="h-4 w-4" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" title={t("theme.toggle")}>
          {icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer rounded-lg">
          <Sun     className="h-4 w-4" />{t("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer rounded-lg">
          <Moon    className="h-4 w-4" />{t("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer rounded-lg">
          <Monitor className="h-4 w-4" />{t("theme.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── User Menu ──────────────────────────────────────────────── */
const EMPLOYEE_BUCKET = "employee-docs";

function UserMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const displayName = user?.displayName ?? user?.name ?? "";
  const initials    = displayName.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.employeePhoto) { setPhotoUrl(null); return; }
    supabase.storage
      .from(EMPLOYEE_BUCKET)
      .createSignedUrl(user.employeePhoto, 60 * 60 * 24)
      .then(({ data }) => setPhotoUrl(data?.signedUrl ?? null));
  }, [user?.employeePhoto]);

  const AvatarImg = ({ size }: { size: "sm" | "lg" }) => (
    <Avatar className={size === "sm" ? "h-6 w-6" : "h-8 w-8"}>
      {photoUrl
        ? <img src={photoUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
        : <AvatarFallback className={`font-bold bg-primary text-primary-foreground ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
            {initials}
          </AvatarFallback>
      }
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 gap-2 px-2 rounded-xl hover:bg-muted/60">
          <AvatarImg size="sm" />
          <span className="text-sm font-medium hidden sm:inline-block max-w-[140px] truncate">
            {displayName}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal pb-2">
          <div className="flex items-center gap-2.5">
            <AvatarImg size="lg" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.shopName}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { logout(); }}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive rounded-lg"
        >
          <LogOut className="h-4 w-4" />{t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Mobile Sheet Menu ──────────────────────────────────────── */
function MobileSheetMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[48px] text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">{t("nav.menu")}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 flex flex-col border-r border-border/50">
        {/* Header */}
        <div className="px-5 py-5 border-b border-border/50 flex items-center gap-3 bg-sidebar">
          <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0">
            <Store className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm leading-tight truncate text-sidebar-foreground">{user?.shopName}</span>
            <span className="text-xs text-sidebar-foreground/50 truncate">{user?.name}</span>
          </div>
        </div>

        <nav className="flex-1 overflow-auto px-3 py-4 space-y-0.5 bg-sidebar">
          {NAV_KEYS.map(({ href, key, icon: Icon }) => {
            const active = isActive(href, location);
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(key)}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border/50 bg-sidebar">
          <button
            onClick={() => { logout(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Mobile Bottom Nav ──────────────────────────────────────── */
function MobileBottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/90 backdrop-blur-xl border-t border-border/60 shadow-2xl shadow-black/10">
      <div className="flex items-center justify-around px-2 pb-safe pt-1">
        {BOTTOM_NAV_KEYS.map(({ href, key, icon: Icon }) => {
          const active = isActive(href, location);
          return (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] rounded-2xl cursor-pointer transition-all ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
                <div className={`h-6 w-6 flex items-center justify-center rounded-lg transition-all ${
                  active ? "bg-primary/12 scale-110" : ""
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className={`text-[10px] font-semibold ${active ? "text-primary" : ""}`}>
                  {t(key)}
                </span>
              </div>
            </Link>
          );
        })}
        <MobileSheetMenu />
      </div>
    </nav>
  );
}

/* ─── Main AppLayout ─────────────────────────────────────────── */
export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Store className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-2.5 w-28 rounded-full" />
        </motion.div>
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const activeNav = NAV_KEYS.find((n) => isActive(n.href, location)) ?? NAV_KEYS[0];
  const { subtitle } = usePageSubtitle();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">

        {/* ── Desktop Sidebar ── */}
        <Sidebar className="border-r border-sidebar-border bg-sidebar hidden md:flex">
          {/* Logo */}
          <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/25 flex items-center justify-center shrink-0">
                <Store className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-sidebar-foreground leading-tight truncate">
                  {user.shopName}
                </span>
                <span className="text-[11px] text-sidebar-foreground/45 truncate">{user.displayName ?? user.name}</span>
              </div>
            </div>
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent className="px-2.5 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-px">
                  {NAV_KEYS.map(({ href, key, icon: Icon }) => {
                    const active = isActive(href, location);
                    return (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="h-9 rounded-xl px-2.5 text-sidebar-foreground/65
                            hover:text-sidebar-foreground hover:bg-sidebar-accent
                            data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-semibold
                            transition-all duration-150"
                        >
                          <Link href={href} className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="text-sm">{t(key)}</span>
                            {active && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="px-2.5 py-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 h-9 px-2.5 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => { logout(); }}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">{t("nav.logout")}</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* ── Main area ── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Topbar — glass effect */}
          <header className="h-14 border-b border-border/60 flex items-center justify-between px-4 md:px-5
                             bg-background/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 rounded-xl hidden md:flex hover:bg-muted/60 transition-colors" />

              {/* Mobile: shop branding */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Store className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-bold truncate max-w-[140px]">{user.shopName}</span>
              </div>

              {/* Desktop: enriched page header — icon + title + active section */}
              {(() => { const NavIcon = activeNav.icon; return (
              <div className="hidden md:flex items-center gap-2.5">
                <div className="h-4 w-px bg-border/60" />
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${activeNav.iconBg}`}>
                  <NavIcon className={`h-3.5 w-3.5 ${activeNav.iconText}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-semibold leading-none ${subtitle ? "text-muted-foreground" : "text-foreground"}`}>
                    {t(activeNav.key)}
                  </p>
                  {subtitle && (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <p className="text-sm font-semibold text-foreground leading-none">{subtitle}</p>
                    </>
                  )}
                </div>
              </div>
              ); })()}
            </div>

            <div className="flex items-center gap-0.5">
              <NotificationCenter />
              <ThemeToggle />
              <LanguageSwitcher />
              <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
              <UserMenu />
            </div>
          </header>

          {/* Page content */}
          <motion.div
            key={location}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <MobileBottomNav />
    </SidebarProvider>
  );
}
