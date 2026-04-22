import { API_V1_PREFIX, DEFAULT_API_ORIGIN } from "@/lib/constants";

/**
 * Public API origin (browser). Set `NEXT_PUBLIC_API_ORIGIN` in `.env` (e.g. `http://127.0.0.1:8002`).
 * Trailing slashes are stripped.
 */
export function getApiOrigin(): string {
  const raw =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_ORIGIN
      ? process.env.NEXT_PUBLIC_API_ORIGIN.trim()
      : DEFAULT_API_ORIGIN;
  return raw.replace(/\/+$/, "");
}

/** Full base URL for versioned JSON API, e.g. `http://127.0.0.1:8002/api/v1`. */
export function getApiV1BaseUrl(): string {
  return `${getApiOrigin()}${API_V1_PREFIX}`;
}
