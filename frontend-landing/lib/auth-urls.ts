/**
 * URLs for product entry (auth and optional demo).
 * Set NEXT_PUBLIC_LOGIN_URL, NEXT_PUBLIC_REGISTER_URL, NEXT_PUBLIC_DEMO_URL (optional).
 */
export function getLoginUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_LOGIN_URL?.trim();
  return url || undefined;
}

export function getRegisterUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_REGISTER_URL?.trim();
  return url || undefined;
}

/** Loom, recorded tour, or in-app demo route. */
export function getDemoUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_DEMO_URL?.trim();
  return url || undefined;
}
