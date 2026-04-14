/** Soft arrows for “redirecting” home state. */
export function RedirectFlowIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M24 60h56l-12-14M80 60l-12 14"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="100"
        y="36"
        width="48"
        height="48"
        rx="8"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        fill="#FFFFFF"
      />
      <path
        d="M160 60h56l-12-14M216 60l-12 14"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="124" cy="60" r="6" fill="#C7A348" opacity="0.85" />
    </svg>
  );
}
