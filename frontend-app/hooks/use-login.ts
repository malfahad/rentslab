"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { setSession } from "@/lib/auth-storage";
import { loginUser, userDtoToSessionUser } from "@/services/auth-service";
import type { LoginRequest } from "@/types/auth";

export function useLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (payload: LoginRequest) => {
      setError(null);
      setPending(true);
      try {
        const res = await loginUser(payload);
        setSession(
          res.access,
          res.refresh,
          userDtoToSessionUser(res.user),
        );
        router.push("/dashboard");
        router.refresh();
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.messageForUser);
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  return { submit, error, pending };
}
