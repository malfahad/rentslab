/**
 * Some clients break links by leaving `&amp;` in the address bar. Normalize
 * before parsing so `uid` / `token` still resolve.
 */
export function parseSearchParamsFromWindowHref(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  try {
    const href = window.location.href.replace(/&amp;/g, '&');
    return new URL(href).searchParams;
  } catch {
    return new URLSearchParams();
  }
}

/** Prefer Next `useSearchParams()`, fall back to normalized window URL. */
export function getQueryParam(
  sp: Pick<URLSearchParams, 'get'>,
  name: string,
): string | null {
  return sp.get(name) ?? parseSearchParamsFromWindowHref().get(name);
}
