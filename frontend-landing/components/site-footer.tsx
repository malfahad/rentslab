import type { ReactNode } from "react";
import Link from "next/link";
import { getLoginUrl, getRegisterUrl } from "@/lib/auth-urls";

const product = [
  { label: "Features", href: "/#features" },
  { label: "Proof", href: "/#proof" },
  { label: "Pricing", href: "/pricing" },
];

const company = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const legal = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
];

export function SiteFooter() {
  const loginUrl = getLoginUrl();
  const registerUrl = getRegisterUrl();

  return (
    <footer className="bg-brand-navy text-blue-100/90">
      <div className="mx-auto max-w-content px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-serif text-xl font-medium tracking-wide text-white"
            >
              RentSlab
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-blue-200/80">
              Know every unit. Collect every shilling. Close every month.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">
              Product
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {product.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-blue-100/90 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">
              Company
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {company.map((item) => (
                <li key={item.label}>
                  <FooterNavLink href={item.href}>{item.label}</FooterNavLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-300/90">
              Account
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {loginUrl ? (
                <li>
                  <a href={loginUrl} className="hover:text-white">
                    Log in
                  </a>
                </li>
              ) : null}
              {registerUrl ? (
                <li>
                  <a href={registerUrl} className="hover:text-white">
                    Register
                  </a>
                </li>
              ) : null}
              {legal.map((item) => (
                <li key={item.label}>
                  <FooterNavLink href={item.href}>{item.label}</FooterNavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-blue-300/80">
              © {new Date().getFullYear()} RentSlab. All rights reserved.
            </p>
            <p className="text-xs text-blue-300/70">
              P.O. Box 204238 Kampala GPO · TIN 1057084798
            </p>
          </div>
          <div className="flex gap-4" aria-label="Social">
            <a
              href="#"
              className="text-blue-300/80 hover:text-white"
              aria-label="LinkedIn"
            >
              <IconLinkedIn className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-blue-300/80 hover:text-white"
              aria-label="X"
            >
              <IconX className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const className = "hover:text-white";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
