/** Empty portfolio — landlord / owner records. */
export function EmptyLandlordsSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="140" cy="170" rx="100" ry="10" fill="#E5E7EB" opacity="0.7" />
      <path
        d="M100 48h80v100H100V48z"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#FFFFFF"
      />
      <path
        d="M120 72h40M120 92h40M120 112h28"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle cx="140" cy="36" r="20" stroke="#C7A348" strokeWidth="1.5" fill="#FFFCF5" />
      <path
        d="M128 36h24M140 28v16"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Empty buildings — stack / street. */
export function EmptyBuildingsSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="140" cy="178" rx="110" ry="10" fill="#E5E7EB" opacity="0.7" />
      <path
        d="M60 60h56v100H60V60zM164 44h56v116h-56V44z"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#F7F9FB"
      />
      <path
        d="M76 100h24M76 120h24M180 88h24M180 108h24"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M132 120h16v40h-16v-40z"
        stroke="#C7A348"
        strokeWidth="1.5"
        fill="#FFFCF5"
      />
    </svg>
  );
}

/** Empty units — door grid. */
export function EmptyUnitsSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="64"
        y="40"
        width="152"
        height="120"
        rx="8"
        stroke="#1E3A5F"
        strokeWidth="1.5"
        fill="#FFFFFF"
      />
      <path
        d="M88 64h48v36H88V64zm56 0h48v36h-48V64zM88 116h48v28H88v-28zm56 0h48v28h-48v-28z"
        stroke="#2F5D8A"
        strokeWidth="1.5"
        fill="#F1F4F7"
      />
      <circle cx="124" cy="136" r="2" fill="#1E3A5F" />
      <circle cx="180" cy="136" r="2" fill="#1E3A5F" />
      <path
        d="M140 28v12"
        stroke="#C7A348"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
