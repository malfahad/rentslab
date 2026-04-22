"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { forgotPassword } from "@/services/auth-service";
import type { ForgotPasswordRequest } from "@/types/auth";

const DEFAULT_FORGOT_PASSWORD_MESSAGE =
  "If an account exists for this email, we sent reset instructions.";

export function useForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(async (payload: ForgotPasswordRequest) => {
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);
    setPending(true);
    try {
      const res = await forgotPassword(payload);
      setSuccess(true);
      setSuccessMessage(res.detail?.trim() || DEFAULT_FORGOT_PASSWORD_MESSAGE);
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

  return { submit, error, success, successMessage, pending };
}
