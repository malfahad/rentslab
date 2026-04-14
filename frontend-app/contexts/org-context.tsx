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
  clearStoredOrgId,
  getStoredOrgId,
  setStoredOrgId,
} from "@/lib/auth-storage";
import { getOrg, listOrgs } from "@/services/org-service";

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

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const envId = readEnvDefaultOrgId();
      if (envId != null) {
        setStoredOrgId(envId);
        if (!cancelled) {
          setOrgIdState(envId);
          setOrgReady(true);
        }
        refreshOrgLabel().catch(() => {});
        return;
      }
      try {
        const orgs = await listOrgs();
        if (cancelled) return;
        const stored = getStoredOrgId();
        let chosen: (typeof orgs)[0] | undefined;
        if (stored != null) {
          chosen = orgs.find((o) => o.id === stored);
        }
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
        if (!cancelled) setOrgReady(true);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshOrgLabel]);

  const setOrgId = useCallback((id: number) => {
    setStoredOrgId(id);
    setOrgIdState(id);
    refreshOrgLabel().catch(() => {});
  }, [refreshOrgLabel]);

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
