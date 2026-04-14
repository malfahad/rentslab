import type { SessionUser } from "@/types/auth";

const ACCESS = "rentslab_access";
const REFRESH = "rentslab_refresh";
const USER = "rentslab_user";
const ORG_ID = "rentslab_org_id";

export function setSession(
  access: string,
  refresh: string,
  user: SessionUser,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS, access);
  localStorage.setItem(REFRESH, refresh);
  localStorage.setItem(USER, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
  localStorage.removeItem(ORG_ID);
}

export function getStoredOrgId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ORG_ID);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function setStoredOrgId(id: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORG_ID, String(id));
}

export function clearStoredOrgId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORG_ID);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS);
}

export function isAuthenticated(): boolean {
  return getAccessToken() ? true : false;
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
