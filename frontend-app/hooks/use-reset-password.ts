"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getQueryParam } from "@/lib/url/search-params";

export function useResetPasswordLinkParams() {
  const searchParams = useSearchParams();
  return useMemo(() => {
    const uid = getQueryParam(searchParams, "uid")?.trim() ?? "";
    const token = getQueryParam(searchParams, "token")?.trim() ?? "";
    return { uid, token, missing: !uid || !token };
  }, [searchParams]);
}
