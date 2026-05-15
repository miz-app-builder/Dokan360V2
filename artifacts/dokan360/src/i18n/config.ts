import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bn from "./locales/bn.json";
import en from "./locales/en.json";

export type SupportedLocale = "bn" | "en";

export const SUPPORTED_LOCALES: { code: SupportedLocale; label: string; nativeLabel: string }[] = [
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "en", label: "English", nativeLabel: "English" },
];

const STORAGE_KEY = "dokan360_language";

export function getStoredLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "bn" || stored === "en") return stored;
  } catch {
  }
  return "bn";
}

export function storeLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      bn: { translation: bn },
      en: { translation: en },
    },
    lng: getStoredLocale(),
    fallbackLng: "bn",
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
