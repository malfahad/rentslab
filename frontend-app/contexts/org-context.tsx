"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SESSION_CHANGED_EVENT,
  clearStoredOrgId,
  getAccessToken,
  getStoredOrgId,
  setStoredOrgId,
} from "@/lib/auth-storage";
import { getOrg, listMyOrgs } from "@/services/org-service";

type OrgContextValue = {
  orgId: number | null;
  orgName: string | null;
  /** True after first org bootstrap attempt (success or failure). */
  orgReady: boolean;
  setOrgId: (id: number) => void;
  refreshOrgLabel: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

function readEnvDefaultOrgId(): number | null {
  if (typeof process === "undefined") return null;
  const raw = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgId, setOrgIdState] = useState<number | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgReady, setOrgReady] = useState(false);

  const refreshOrgLabel = useCallback(async () => {
    const id = getStoredOrgId();
    if (id == null) {
      setOrgName(null);
      return;
    }
    try {
      const o = await getOrg(id);
      setOrgName(o.name);
    } catch {
      setOrgName(null);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    const envId = readEnvDefaultOrgId();
    if (envId != null) {
      setStoredOrgId(envId);
      setOrgIdState(envId);
      setOrgReady(true);
      refreshOrgLabel().catch(() => {});
      return;
    }

    if (!getAccessToken()) {
      clearStoredOrgId();
      setOrgIdState(null);
      setOrgName(null);
      setOrgReady(true);
      return;
    }

    try {
      const orgs = await listMyOrgs();
      const stored = getStoredOrgId();
      let chosen = stored != null ? orgs.find((o) => o.id === stored) : undefined;
      if (!chosen && orgs.length > 0) {
        chosen = orgs[0];
      }
      if (chosen) {
        setStoredOrgId(chosen.id);
        setOrgIdState(chosen.id);
        setOrgName(chosen.name);
      } else {
        clearStoredOrgId();
        setOrgIdState(null);
        setOrgName(null);
      }
    } catch {
      /* leave org unset */
    } finally {
      setOrgReady(true);
    }
  }, [refreshOrgLabel]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setOrgReady(false);
      await bootstrap();
      if (!cancelled) {
        /* orgReady set inside bootstrap */
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  useEffect(() => {
    function onSessionChange() {
      void bootstrap();
    }
    window.addEventListener(SESSION_CHANGED_EVENT, onSessionChange);
    return () => window.removeEventListener(SESSION_CHANGED_EVENT, onSessionChange);
  }, [bootstrap]);

  const setOrgId = useCallback(
    (id: number) => {
      setStoredOrgId(id);
      setOrgIdState(id);
      refreshOrgLabel().catch(() => {});
    },
    [refreshOrgLabel],
  );

  const value = useMemo(
    () => ({
      orgId,
      orgName,
      orgReady,
      setOrgId,
      refreshOrgLabel,
    }),
    [orgId, orgName, orgReady, setOrgId, refreshOrgLabel],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return ctx;
}
