/** Success badge — account ready. */
export function ActivateSuccessBadge({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="100" cy="100" r="72" stroke="#2E7D32" strokeWidth="1.5" fill="#F4FBF5" />
      <circle cx="100" cy="100" r="52" stroke="#2E7D32" strokeWidth="1.5" opacity="0.35" />
      <path
        d="M72 102l20 20 40-48"
        stroke="#2E7D32"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M100 36v-12M100 176v-12M36 100h-12M176 100h12"
        stroke="#C7A348"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
