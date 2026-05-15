import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { storeLocale, type SupportedLocale } from "@/i18n/config";

/* ─── Context shape ───────────────────────────────────────────── */
interface LanguageContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
  isBengali: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

/* ─── Provider ────────────────────────────────────────────────── */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<SupportedLocale>(
    (i18n.language as SupportedLocale) ?? "bn"
  );

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    i18n.changeLanguage(next);
    storeLocale(next);
    document.documentElement.lang = next === "bn" ? "bn-BD" : "en";
  }, [i18n]);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "bn" ? "en" : "bn");
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "bn" ? "bn-BD" : "en";
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, isBengali: locale === "bn" }}>
      {children}
    </LanguageContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
