"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardUIContextValue = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (v: boolean) => void;
};

const DashboardUIContext = createContext<DashboardUIContextValue | null>(null);

export function DashboardUIProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      globalSearchOpen,
      setGlobalSearchOpen,
    }),
    [sidebarCollapsed, globalSearchOpen, toggleSidebar],
  );

  return (
    <DashboardUIContext.Provider value={value}>
      {children}
    </DashboardUIContext.Provider>
  );
}

export function useDashboardUI() {
  const ctx = useContext(DashboardUIContext);
  if (!ctx) {
    throw new Error("useDashboardUI must be used within DashboardUIProvider");
  }
  return ctx;
}
