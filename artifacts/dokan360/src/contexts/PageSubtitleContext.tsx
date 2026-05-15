import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface PageSubtitleContextValue {
  subtitle: string | null;
  setSubtitle: (s: string | null) => void;
}

const PageSubtitleContext = createContext<PageSubtitleContextValue>({
  subtitle: null,
  setSubtitle: () => {},
});

export function PageSubtitleProvider({ children }: { children: ReactNode }) {
  const [subtitle, setSubtitleState] = useState<string | null>(null);
  const setSubtitle = useCallback((s: string | null) => setSubtitleState(s), []);
  return (
    <PageSubtitleContext.Provider value={{ subtitle, setSubtitle }}>
      {children}
    </PageSubtitleContext.Provider>
  );
}

export function usePageSubtitle() {
  return useContext(PageSubtitleContext);
}
