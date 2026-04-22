"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { COPY } from "@/lib/copy/auth";
import type { ForgotPasswordRequest } from "@/types/auth";

export type ForgotPasswordFormProps = {
  onSubmit: (payload: ForgotPasswordRequest) => void | Promise<void>;
  error: string | null;
  success: boolean;
  successMessage: string | null;
  pending: boolean;
};

export function ForgotPasswordForm({
  onSubmit,
  error,
  success,
  successMessage,
  pending,
}: ForgotPasswordFormProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    void onSubmit({ email });
  }

  if (success && successMessage) {
    return (
      <div className="flex w-full flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8">
        <div className="text-center">
          <h2 className="font-serif text-2xl font-medium text-brand-navy">
            {COPY.forgotSuccessTitle}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
            {COPY.forgotSuccessBody}
          </p>
          <p className="mt-4 rounded-lg bg-[#F1F4F7] px-4 py-3 text-sm text-[#374151]">
            {successMessage}
          </p>
        </div>
        <Link
          className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue"
          href="/login"
        >
          Back to sign in
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
        <span className="font-medium text-[#374151]">Work email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
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
        disabled={pending}
        className="h-11 rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Sending reset link..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        Remembered your password?{" "}
        <Link
          className="font-medium text-brand-navy underline decoration-brand-navy/30 underline-offset-2 hover:decoration-brand-navy"
          href="/login"
        >
          Sign in instead
        </Link>
      </p>
    </form>
  );
}
