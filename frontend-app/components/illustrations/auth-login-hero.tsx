/** Abstract building + dashboard — line art, brand navy + muted gold accent. */
export function AuthLoginHero({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="24"
        y="48"
        width="272"
        height="140"
        rx="12"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#FFFFFF"
      />
      <path
        d="M48 72h64v12H48V72zm0 28h96v8H48v-8zm0 20h80v8H48v-8z"
        fill="#2F5D8A"
        opacity="0.35"
      />
      <rect
        x="200"
        y="64"
        width="72"
        height="48"
        rx="6"
        stroke="#C7A348"
        strokeWidth="1.5"
        fill="#FFFCF5"
      />
      <path
        d="M216 88h40M216 98h28"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M160 32l-56 32v124h112V64l-56-32z"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#F7F9FB"
      />
      <path
        d="M136 88h48M136 104h48M136 120h32"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="248" cy="168" r="20" stroke="#1E3A5F" strokeWidth="1.5" fill="#FFFFFF" />
      <path
        d="M240 168l6 6 14-14"
        stroke="#2E7D32"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
