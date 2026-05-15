import { useState, useEffect } from "react";
import type { PrintSize } from "@/components/pos/ThermalReceipt";

export interface PrinterSettings {
  paperSize:  PrintSize;
  autoPrint:  boolean;
  copies:     1 | 2 | 3;
}

const STORAGE_KEY = "dokan360_printer_settings";

const DEFAULTS: PrinterSettings = {
  paperSize: "58mm",
  autoPrint: false,
  copies:    1,
};

function load(): PrinterSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function usePrinterSettings() {
  const [settings, setSettings] = useState<PrinterSettings>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function update(patch: Partial<PrinterSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return { settings, update };
}
