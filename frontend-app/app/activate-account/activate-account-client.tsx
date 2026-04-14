"use client";

import { ActivateAccountView } from "@/components/activate-account-view";
import { useActivateAccount } from "@/hooks/use-activate-account";

export function ActivateAccountClient() {
  const { status, message } = useActivateAccount();
  return <ActivateAccountView status={status} message={message} />;
}
