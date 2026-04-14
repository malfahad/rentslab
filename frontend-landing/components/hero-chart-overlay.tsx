/** Faint chart lines behind the hero (rent / occupancy). Keeps type readable. */
export function HeroChartOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.075]"
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 320 Q200 280 400 200 T800 120 T1200 80"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M0 340 L150 310 L300 300 L450 250 L600 260 L750 200 L900 210 L1050 160 L1200 140"
          stroke="white"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M0 360 L200 350 L400 330 L600 340 L800 300 L1000 290 L1200 270"
          stroke="#C7A348"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.4"
        />
        <g opacity="0.28">
          {[100, 220, 340, 460, 580, 700, 820, 940, 1060].map((x) => (
            <line
              key={x}
              x1={x}
              y1="80"
              x2={x}
              y2="380"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="4 6"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
