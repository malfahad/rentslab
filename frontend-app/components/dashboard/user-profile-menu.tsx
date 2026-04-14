"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearSession, getStoredUser } from "@/lib/auth-storage";

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "?";
  const parts = local.replace(/[^a-zA-Z0-9]/g, " ").trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

export function UserProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = getStoredUser();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const email = user?.email ?? "";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        data-testid="user-profile-trigger"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 outline-none ring-brand-gold ring-offset-2 ring-offset-brand-navy hover:bg-white/10 focus-visible:ring-2"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold/90 text-xs font-semibold text-brand-navy">
          {initialsFromEmail(email)}
        </span>
        <span className="max-w-[160px] truncate text-left text-sm text-white/90">
          <span className="block text-xs text-white/60">Signed in</span>
          <span data-testid="user-email">{email}</span>
        </span>
        <svg
          className={`h-4 w-4 text-white/70 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
          role="menu"
          data-testid="user-profile-menu"
        >
          <Link
            href="/dashboard/settings/profile"
            className="block px-3 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB]"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/dashboard/settings/organization"
            className="block px-3 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB]"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Organization
          </Link>
          <Link
            href="/dashboard/settings/notifications"
            className="block px-3 py-2 text-sm text-[#374151] hover:bg-[#F9FAFB]"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Notifications
          </Link>
          <hr className="my-1 border-[#E5E7EB]" />
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
            onClick={() => {
              clearSession();
              setOpen(false);
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
