"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { COPY } from "@/lib/copy/auth";
import {
  ACTIVATION_LINK_INCOMPLETE,
  mapActivationApiDetail,
} from "@/lib/messages/activation";
import { getQueryParam } from "@/lib/url/search-params";
import { activateAccount } from "@/services/auth-service";

export type ActivateAccountStatus = "loading" | "success" | "error";

export function useActivateAccount(): {
  status: ActivateAccountStatus;
  message: string;
} {
  const searchParams = useSearchParams();

  const { uid, token, missing } = useMemo(() => {
    const u = getQueryParam(searchParams, "uid")?.trim() ?? "";
    const t = getQueryParam(searchParams, "token")?.trim() ?? "";
    return { uid: u, token: t, missing: !u || !t };
  }, [searchParams]);

  const [status, setStatus] = useState<ActivateAccountStatus>(() =>
    missing ? "error" : "loading",
  );
  const [message, setMessage] = useState(() =>
    missing ? ACTIVATION_LINK_INCOMPLETE : COPY.activateLoadingBody,
  );

  useEffect(() => {
    if (missing) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await activateAccount({ uid, token });
        if (cancelled) return;
        setStatus("success");
        setMessage(
          res.detail?.trim() || "Account activated. You can log in now.",
        );
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        if (e instanceof ApiError) {
          setMessage(mapActivationApiDetail(e.messageForUser));
        } else {
          setMessage("Something went wrong. Try again later.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missing, uid, token]);

  return { status, message };
}
