"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { COPY } from "@/lib/copy/auth";
import {
  RESET_LINK_INCOMPLETE,
  mapResetPasswordApiDetail,
} from "@/lib/messages/reset-password";
import { resetPassword } from "@/services/auth-service";

export type ResetPasswordFormProps = {
  uid: string;
  token: string;
  missing: boolean;
};

export function ResetPasswordForm({ uid, token, missing }: ResetPasswordFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    missing ? RESET_LINK_INCOMPLETE : null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missing) return;

    const form = e.currentTarget;
    const password = (form.elements.namedItem("new_password") as HTMLInputElement)
      .value;
    const confirm = (form.elements.namedItem("confirm_password") as HTMLInputElement)
      .value;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const res = await resetPassword({ uid, token, new_password: password });
      setSuccessMessage(res.detail?.trim() || COPY.resetSuccessBody);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(mapResetPasswordApiDetail(e.messageForUser));
      } else {
        setError("Something went wrong. Try again later.");
      }
    } finally {
      setPending(false);
    }
  }

  if (successMessage) {
    return (
      <div className="flex w-full flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-medium text-brand-navy">
            {COPY.resetSuccessTitle}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#1A1A1A]">
            {successMessage}
          </p>
        </div>
        <Link
          className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue"
          href="/login"
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8"
      onSubmit={handleSubmit}
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#374151]">New password</span>
        <input
          name="new_password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          placeholder="••••••••"
          className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#374151]">Confirm new password</span>
        <input
          name="confirm_password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
          placeholder="••••••••"
          className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </label>

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || missing}
        className="h-11 rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Resetting password..." : "Reset password"}
      </button>
    </form>
  );
}
