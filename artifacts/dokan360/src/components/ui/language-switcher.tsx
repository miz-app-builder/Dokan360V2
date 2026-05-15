import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n/config";

/* ─── Dropdown variant (topbar) ─────────────────────────────── */
export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          title={t("lang.toggle")}
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {SUPPORTED_LOCALES.map(({ code, nativeLabel }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code as SupportedLocale)}
            className="gap-2 cursor-pointer"
          >
            <span className="flex-1 text-sm">{nativeLabel}</span>
            {locale === code && (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Inline toggle (compact — for login/auth pages) ────────── */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale } = useLanguage();

  return (
    <button
      onClick={toggleLocale}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border/60 bg-background/60 hover:bg-muted/60 transition-colors ${className ?? ""}`}
      title={locale === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
    >
      <Languages className="h-3.5 w-3.5" />
      {locale === "bn" ? "EN" : "বাং"}
    </button>
  );
}

/* ─── Mobile-friendly full-width switcher ───────────────────── */
export function LanguageSwitcherFull() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
      {SUPPORTED_LOCALES.map(({ code, nativeLabel }) => (
        <button
          key={code}
          onClick={() => setLocale(code as SupportedLocale)}
          className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all ${
            locale === code
              ? "bg-card text-foreground shadow-sm border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {nativeLabel}
        </button>
      ))}
    </div>
  );
}
