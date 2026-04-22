const proofPoints = [
  {
    label: "Know who owes what, right now",
    detail:
      "A live rent roll that shows arrears by unit, by tenant, and by how many days overdue.",
  },
  {
    label: "Track every payment, wherever it came from",
    detail:
      "MoMo, bank transfer, and cash records flow into one place with clear invoice allocation context.",
  },
  {
    label: "Close your books without the back-and-forth",
    detail:
      "Reconcile in minutes, not days. No exports, no manual matching, no guesswork.",
  },
  {
    label: "Used by people who run real portfolios",
    detail:
      "Property managers and finance teams across East Africa rely on RentSlab to close the month with confidence.",
  },
];

export function PortfolioProof() {
  return (
    <section
      id="proof"
      className="scroll-mt-24 border-y border-gray-200 bg-white py-16 md:py-20"
      aria-labelledby="proof-heading"
    >
      <div className="mx-auto max-w-content px-4 md:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-brand-gold">
          Built for the real world
        </p>
        <h2
          id="proof-heading"
          className="mt-2 text-center font-serif text-2xl font-medium tracking-wide text-brand-navy md:text-3xl"
        >
          Designed around how rent actually works here
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#374151]">
          Mobile money. Multi-currency. Late payers. RentSlab was built for East
          African portfolios, not copied from a Silicon Valley template.
        </p>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {proofPoints.map((p) => (
            <li
              key={p.label}
              className="rounded-xl border border-gray-200 bg-surface-main p-6"
            >
              <p className="font-sans text-base font-semibold text-brand-navy">
                {p.label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#374151]">
                {p.detail}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-sm text-[#6B7280]">
          Purpose-built for East Africa. Not a global product with local flags
          slapped on.
        </p>
      </div>
    </section>
  );
}
