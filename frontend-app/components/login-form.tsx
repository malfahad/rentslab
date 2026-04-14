"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import type { LoginRequest } from "@/types/auth";

export type LoginFormProps = {
  onSubmit: (payload: LoginRequest) => void | Promise<void>;
  error: string | null;
  pending: boolean;
};

export function LoginForm({ onSubmit, error, pending }: LoginFormProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    void onSubmit({ email, password });
  }

  return (
    <form
      className="flex w-full flex-col gap-5 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8"
      onSubmit={handleSubmit}
    >
      <p className="text-sm text-[#6B7280]">
        Enter the email and password you use for RentSlab.
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-[#374151]">Work email</span>
        <input
          data-testid="login-email"
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
          data-testid="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-[#1A1A1A] placeholder:text-[#9CA3AF] focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
        />
      </label>

      {error ? (
        <div
          data-testid="login-error"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <button
        data-testid="login-submit"
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-brand-navy text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Signing you in…" : "Sign in to workspace"}
      </button>

      <p className="text-center text-sm text-[#6B7280]">
        New to RentSlab?{" "}
        <Link
          className="font-medium text-brand-navy underline decoration-brand-navy/30 underline-offset-2 hover:decoration-brand-navy"
          href="/register"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
