import { useLanguage } from "@/contexts/LanguageContext";

/* ─── Bengali digit map ───────────────────────────────────────── */
const BN_DIGITS: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

function toBengaliDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => BN_DIGITS[d] ?? d);
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useLocale() {
  const { locale, isBengali } = useLanguage();

  /**
   * Format a number as BDT currency.
   * Bengali mode  → ৳১,২৩,৪৫৬  (bn-BD locale, Bengali digits)
   * English mode  → ৳1,23,456   (bn-BD grouping but Latin digits)
   */
  const formatCurrency = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return "—";
    const n = Number(value);
    if (isNaN(n)) return "—";

    if (isBengali) {
      const formatted = n.toLocaleString("bn-BD");
      return "৳" + formatted;
    }
    return "৳" + n.toLocaleString("en-IN");
  };

  /**
   * Format a plain number.
   * Bengali mode → Bengali digits
   * English mode → Latin digits
   */
  const formatNumber = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return "—";
    const n = Number(value);
    if (isNaN(n)) return "—";

    if (isBengali) {
      return toBengaliDigits(n.toLocaleString("en-IN"));
    }
    return n.toLocaleString("en-IN");
  };

  /**
   * Format a date string or Date object.
   * Bengali mode → Bengali script date (e.g. ৭ মে, ২০২৬)
   * English mode → English date (e.g. May 7, 2026)
   */
  const formatDate = (
    value: string | Date | undefined | null,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";

    const localeStr = isBengali ? "bn-BD" : "en-GB";
    const defaultOpts: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    };
    return d.toLocaleDateString(localeStr, defaultOpts);
  };

  /**
   * Format a datetime string or Date object (with time).
   */
  const formatDateTime = (
    value: string | Date | undefined | null,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    if (!value) return "—";
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";

    const localeStr = isBengali ? "bn-BD" : "en-GB";
    const defaultOpts: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...options,
    };
    return d.toLocaleString(localeStr, defaultOpts);
  };

  /**
   * Convert Bengali/Latin digits to a plain number.
   * Useful for parsing user input.
   */
  const parseLocaleNumber = (value: string): number => {
    const normalized = value.replace(/[০-৯]/g, (c) => {
      return String(Object.entries(BN_DIGITS).find(([, v]) => v === c)?.[0] ?? c);
    });
    return Number(normalized.replace(/,/g, ""));
  };

  return {
    locale,
    isBengali,
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateTime,
    parseLocaleNumber,
  };
}
