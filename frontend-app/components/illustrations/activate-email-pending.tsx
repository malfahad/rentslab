/** Envelope + spark — “we’re confirming”. */
export function ActivateEmailPending({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="40"
        y="56"
        width="200"
        height="120"
        rx="10"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#FFFFFF"
      />
      <path
        d="M40 76l100 64 100-64"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M56 96h48M56 112h72"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="220" cy="48" r="16" stroke="#C7A348" strokeWidth="1.5" fill="#FFFCF5" />
      <path
        d="M214 48l4 4 8-8"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
