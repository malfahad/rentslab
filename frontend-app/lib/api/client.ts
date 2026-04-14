import { ApiError } from "@/lib/api/errors";
import { getApiV1BaseUrl } from "@/lib/config/public-env";

function joinUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/+$/, "")}${p}`;
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

/**
 * JSON `fetch` to the configured API v1 base. Throws {@link ApiError} when `!response.ok`.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (body !== undefined && !(body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const url = joinUrl(getApiV1BaseUrl(), path);
  const res = await fetch(url, {
    ...rest,
    headers,
    body:
      body === undefined || body instanceof FormData
        ? (body as BodyInit | undefined)
        : JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = { detail: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, parsed);
  }

  return parsed as T;
}
