"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { AuthRegisterHero } from "@/components/illustrations/auth-register-hero";
import { useAccessRequest } from "@/hooks/use-access-request";

export default function BetaAccessRequestPage() {
  const { submit, error, success, pending } = useAccessRequest();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (!email) return;
    void submit(email);
  }

  return (
    <AuthPageLayout
      title="Beta access by request"
      subtitle="Public registration is currently paused while we onboard early users in cohorts."
      illustration={<AuthRegisterHero className="w-full" />}
    >
      <form
        className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-8"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold text-brand-navy">Request beta access</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
          Enter your email and we will add you to the beta access list.
        </p>
        <label className="mt-5 flex flex-col gap-1.5 text-sm">
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
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {success ? (
          <div
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            role="status"
          >
            {success}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-brand-navy px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-blue disabled:opacity-60"
        >
          {pending ? "Submitting request..." : "Request beta access"}
        </button>
        <p className="mt-4 text-sm text-[#6B7280]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-navy underline decoration-brand-navy/30 underline-offset-2 hover:decoration-brand-navy"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
}
