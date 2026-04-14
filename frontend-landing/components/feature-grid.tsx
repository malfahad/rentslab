const features = [
  {
    title: "Every unit. One place.",
    description:
      "See your entire portfolio at a glance. Vacancies, active leases, upcoming renewals — no more digging through folders.",
    tint: "bg-[#E8EDF5] border-[#D4DEE8]",
    icon: IconBuilding,
    textClass: "text-[#1A1A1A]",
  },
  {
    title: "Get paid. Know when. Know who.",
    description:
      "Invoices go out on time. Payments come in tracked. Arrears show up before they become a problem.",
    tint: "bg-[#E5EBF4] border-[#CCD8E8]",
    icon: IconLedger,
    textClass: "text-[#1A1A1A]",
  },
  {
    title: "Give your team what they need, nothing they don't",
    description:
      "Your caretaker sees their block. Your accountant sees the books. You see everything.",
    tint: "bg-[#EDE8DC] border-[#D4C4A8]",
    icon: IconUsers,
    textClass: "text-[#111827]",
  },
  {
    title: "Reports your accountant will actually trust",
    description:
      "Cash flow, rent roll, collection rates — export clean reports at month end without touching a spreadsheet.",
    tint: "bg-[#EDF2F8] border-[#C5D4E4]",
    icon: IconChart,
    textClass: "text-[#1A1A1A]",
  },
];

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="scroll-mt-24 bg-surface-main py-16 md:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h2
          id="features-heading"
          className="font-serif text-2xl font-medium tracking-wide text-brand-navy md:text-3xl"
        >
          Built for portfolios where every shilling has to be accounted for
        </h2>
        <p className="mt-3 max-w-2xl text-[#1A1A1A]">
          Whether you manage 10 units or 500, RentSlab grows with your books,
          not against them.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <li
              key={f.title}
              className={`flex flex-col rounded-xl border p-6 shadow-sm ${f.tint}`}
            >
              <f.icon className="h-10 w-10 text-brand-navy/90" />
              <h3 className="mt-4 font-sans text-lg font-semibold text-brand-navy">
                {f.title}
              </h3>
              <p
                className={`mt-2 flex-1 text-sm leading-relaxed ${f.textClass}`}
              >
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
      />
    </svg>
  );
}

function IconLedger({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414-.336.75-.75.75H3.75a.75.75 0 0 1-.75-.75V6h15Zm-1.5 12.75v-.75a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v.75m19.5 0c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 0 1 2.625 18.75v-.75m19.5 0v.75a1.125 1.125 0 0 1-1.125 1.125H3.75A1.125 1.125 0 0 1 2.625 18.75v-.75"
      />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v4.125c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 17.25v-4.125ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.625c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v13.125c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}
