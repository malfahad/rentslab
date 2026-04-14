"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { AuthRegisterHero } from "@/components/illustrations/auth-register-hero";
import { COPY } from "@/lib/copy/auth";
import type { RegisterRequest } from "@/types/auth";

export type RegisterFormProps = {
  onSubmit: (payload: RegisterRequest) => void | Promise<void>;
  error: string | null;
  success: boolean;
  successMessage: string | null;
  pending: boolean;
};

export function RegisterForm({
  onSubmit,
  error,
  success,
  successMessage,
  pending,
}: RegisterFormProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const orgName = (form.elements.namedItem("org_name") as HTMLInputElement)
      .value;

    const payload: RegisterRequest = {
      email,
      password,
      ...(orgName.trim() ? { org_name: orgName.trim() } : {}),
    };
    void onSubmit(payload);
  }

  if (success && successMessage) {
    return (
      <div
        className="flex w-full flex-col gap-6 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8"
        data-testid="register-success"
      >
        <div className="mx-auto w-full max-w-[220px]">
          <AuthRegisterHero className="w-full" />
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl font-medium text-brand-navy">
            {COPY.registerSuccessTitle}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6B7280]">
            {COPY.registerSuccessBody}
          </p>
          <p className="mt-4 rounded-lg bg-[#F1F4F7] px-4 py-3 text-sm text-[#374151]">
            {successMessage}
          </p>
        </div>
        <Link
          className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue"
          href="/login"
          data-testid="register-go-login"
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
      <p className="text-sm text-[#6B7280]">
        We’ll create your organization and send a quick email to confirm
        before you sign in.
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#374151]">Work email</span>
        <input
          data-testid="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#374151]">Password</span>
        <input
          data-testid="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
        <span className="text-xs text-[#9CA3AF]">{COPY.registerPasswordHint}</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#374151]">Organization name</span>
        <span className="text-xs text-[#9CA3AF]">Optional — we’ll suggest one from your email if empty.</span>
        <input
          data-testid="register-org-name"
          name="org_name"
          type="text"
          autoComplete="organization"
          placeholder="e.g. Acme Property Management"
          className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </label>

      {error ? (
        <div
          data-testid="register-error"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <button
        data-testid="register-submit"
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Creating your account…" : "Create account & send email"}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        Already registered?{" "}
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
