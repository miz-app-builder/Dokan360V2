import { useState, useEffect } from "react";

export interface NotifSettings {
  lowStock:    boolean;
  newSale:     boolean;
  dueAlert:    boolean;
  dailyReport: boolean;
  email:       boolean;
}

const STORAGE_KEY = "dokan360_notif_settings";

const DEFAULTS: NotifSettings = {
  lowStock:    true,
  newSale:     false,
  dueAlert:    true,
  dailyReport: false,
  email:       false,
};

function load(): NotifSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function useNotifSettings() {
  const [settings, setSettings] = useState<NotifSettings>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function update(patch: Partial<NotifSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  return { settings, update };
}
