/** Organization + key / new account — welcoming, not decorative noise. */
export function AuthRegisterHero({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="160" cy="188" rx="120" ry="12" fill="#E5E7EB" opacity="0.6" />
      <rect
        x="72"
        y="56"
        width="176"
        height="112"
        rx="12"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#FFFFFF"
      />
      <path
        d="M96 88h128M96 108h96M96 128h112"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="160" cy="40" r="28" stroke="#1E3A5F" strokeWidth="1.5" fill="#F7F9FB" />
      <path
        d="M148 40c0-6 5-11 12-11s12 5 12 11-5 11-12 11-12-5-12-11z"
        stroke="#1E3A5F"
        strokeWidth="1.5"
      />
      <path
        d="M136 56c0-8 10-14 24-14s24 6 24 14"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M224 152l16-8v24l-16-8v-8z"
        fill="#C7A348"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="232" cy="132" r="10" stroke="#1E3A5F" strokeWidth="1.5" fill="#FFFCF5" />
      <path
        d="M228 132h8M232 128v8"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
