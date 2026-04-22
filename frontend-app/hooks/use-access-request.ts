"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { createAccessRequest } from "@/services/auth-service";

export function useAccessRequest() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(async (email: string) => {
    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const res = await createAccessRequest({ email });
      setSuccess(res.detail?.trim() || "Access request received. We will contact you soon.");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.messageForUser);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setPending(false);
    }
  }, []);

  return { submit, error, success, pending };
}
