"use client";

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { DEFAULT_REGISTER_SUCCESS_MESSAGE } from "@/lib/constants";
import { registerUser } from "@/services/auth-service";
import type { RegisterRequest } from "@/types/auth";

export function useRegister() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(async (payload: RegisterRequest) => {
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);
    setPending(true);
    try {
      const res = await registerUser(payload);
      setSuccess(true);
      setSuccessMessage(res.detail?.trim() || DEFAULT_REGISTER_SUCCESS_MESSAGE);
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
