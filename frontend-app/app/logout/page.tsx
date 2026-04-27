"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { clearSession } from "@/lib/auth-storage";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  return null;
}
