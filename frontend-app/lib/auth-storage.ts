import type { SessionUser } from "@/types/auth";

const ACCESS = "rentslab_access";
const REFRESH = "rentslab_refresh";
const USER = "rentslab_user";
const ORG_ID = "rentslab_org_id";

export const SESSION_CHANGED_EVENT = "rentslab:session-changed";

function dispatchSessionChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function setSession(
  access: string,
  refresh: string,
  user: SessionUser,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS, access);
  localStorage.setItem(REFRESH, refresh);
  localStorage.setItem(USER, JSON.stringify(user));
  dispatchSessionChanged();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
  localStorage.removeItem(ORG_ID);
  dispatchSessionChanged();
}

/**
 * Clears the session and sends the user to sign-in. Use when a private (org-scoped)
 * API call cannot send `X-Org-ID` or when the server rejects the session (401).
 */
export function signOutAndRedirectToLogin(reason: string): void {
  if (typeof window === "undefined") return;
  clearSession();
  const qs = new URLSearchParams({ reason });
  window.location.assign(`/login?${qs.toString()}`);
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
