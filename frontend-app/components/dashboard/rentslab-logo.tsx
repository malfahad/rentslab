import Link from "next/link";

/** Wordmark + mark; links to app home (`/`). */
export function RentSlabLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2 rounded-md outline-none ring-brand-gold ring-offset-2 ring-offset-brand-navy focus-visible:ring-2"
      aria-label="RentSlab home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-brand-gold"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path
            d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!collapsed ? (
        <span className="font-serif text-lg font-medium tracking-tight text-white">
          RentSlab
        </span>
      ) : null}
    </Link>
  );
}
