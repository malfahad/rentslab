/** Broken / expired link — clock + unlinked chain metaphor. */
export function ActivateLinkBroken({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="140" cy="96" r="56" stroke="#D32F2F" strokeWidth="1.5" fill="#FEF7F7" />
      <path
        d="M112 96c0-15 12-28 28-28s28 13 28 28-12 28-28 28-28-13-28-28z"
        stroke="#D32F2F"
        strokeWidth="1.5"
      />
      <path
        d="M118 90h44M118 102h44"
        stroke="#D32F2F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M200 152l24 24M224 152l-24 24"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M48 160h56M88 144v32"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
