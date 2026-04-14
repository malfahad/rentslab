import Link from "next/link";
import { getDemoUrl, getLoginUrl, getRegisterUrl } from "@/lib/auth-urls";

const nav = [
  { label: "Product", href: "/#features" },
  { label: "Proof", href: "/#proof" },
  { label: "Pricing", href: "/#pricing" },
];

export function SiteHeader() {
  const loginUrl = getLoginUrl();
  const registerUrl = getRegisterUrl();
  const demoUrl = getDemoUrl();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="font-serif text-xl font-medium tracking-wide text-brand-navy"
        >
          RentSlab
        </Link>
        <nav
          className="hidden items-center gap-6 text-sm font-normal text-[#4B5563] md:flex"
          aria-label="Primary"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-brand-navy"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {demoUrl ? (
            <a
              href={demoUrl}
              className="text-sm font-normal text-brand-navy/90 underline-offset-4 hover:underline"
            >
              Demo
            </a>
          ) : null}
          {loginUrl ? (
            <a
              href={loginUrl}
              className="text-sm font-normal text-[#6B7280] transition-colors hover:text-brand-navy"
            >
              Log in
            </a>
          ) : null}
          {registerUrl ? (
            <a
              href={registerUrl}
              className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-normal text-brand-navy transition-opacity hover:opacity-90"
            >
              Sign up
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
