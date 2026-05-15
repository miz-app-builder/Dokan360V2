import { useState, useEffect } from "react";

export interface SystemSettings {
  language:          "bn" | "en";
  timezone:          string;
  dateFormat:        string;
  currency:          string;
  lowStockThreshold: number;
}

const STORAGE_KEY = "dokan360_system_settings";

const DEFAULTS: SystemSettings = {
  language:          "bn",
  timezone:          "Asia/Dhaka",
  dateFormat:        "DD/MM/YYYY",
  currency:          "BDT",
  lowStockThreshold: 5,
};

function load(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function update(patch: Partial<SystemSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return { settings, update };
}
