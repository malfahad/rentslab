export function ProductPreview() {
  return (
    <section
      className="bg-surface-section py-16 md:py-20"
      aria-labelledby="preview-heading"
    >
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h2
          id="preview-heading"
          className="text-center font-serif text-2xl font-medium tracking-wide text-brand-navy md:text-3xl"
        >
          This is what clarity looks like
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[#374151]">
          Everything your finance team needs to close the month without a single
          follow-up call.
        </p>
        <div className="mt-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-[#F9FAFB] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FECACA]" />
              <span className="h-3 w-3 rounded-full bg-[#FDE68A]" />
              <span className="h-3 w-3 rounded-full bg-[#A7F3D0]" />
              <span className="ml-2 font-sans text-xs text-[#6B7280]">
                RentSlab / Portfolio
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#059669]">
              <span>Last updated: 2 mins ago</span>
              <span className="hidden text-[#6B7280] sm:inline">
                Synced: MoMo + bank
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px border-b border-gray-100 bg-gray-100 md:grid-cols-4">
            <KpiCell
              label="Total arrears"
              value="UGX 3.2M"
              valueClassName="text-amber-700"
            />
            <KpiCell
              label="Occupancy"
              value="92%"
              valueClassName="text-brand-navy"
            />
            <KpiCell
              label="Collection rate"
              value="87%"
              valueClassName="text-emerald-700"
            />
            <KpiCell
              label="Open invoices"
              value="14"
              valueClassName="text-[#1A1A1A]"
            />
          </div>
          <div className="grid gap-0 md:grid-cols-[1fr_280px]">
            <div className="border-b border-gray-100 p-4 md:border-b-0 md:border-r">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                    Rent roll (UGX)
                  </p>
                  <p className="mt-1 font-serif text-2xl font-medium text-brand-navy">
                    24.8M
                  </p>
                  <p className="text-xs text-[#059669]">+12% vs last period</p>
                </div>
                <div className="h-16 w-40 rounded bg-gradient-to-t from-brand-navy/10 to-transparent">
                  <svg
                    className="h-full w-full"
                    viewBox="0 0 160 64"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M0 50 L20 45 L40 48 L60 30 L80 35 L100 20 L120 25 L140 12 L160 8"
                      fill="none"
                      stroke="#1E3A5F"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  ["Unit 4B", "Current", "2.1M"],
                  ["Shop 12", "Arrears 5d", "n/a"],
                  ["Apt 7A", "Current", "1.4M"],
                ].map(([unit, status, amt]) => (
                  <div
                    key={unit}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-[#FAFBFC] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[#111827]">{unit}</span>
                    <span className="text-[#4B5563]">{status}</span>
                    <span className="font-mono text-xs text-brand-navy">
                      {amt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Tenant
              </p>
              <p className="mt-2 font-medium text-brand-navy">
                Nakato, lease #4421
              </p>
              <div className="mt-4 space-y-2 text-sm text-[#1A1A1A]">
                <p>Last payment: MoMo, ref OK</p>
                <p>Open invoice: 1</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-100">
                <div
                  className="h-full w-[80%] rounded-full bg-brand-gold/80"
                  aria-hidden
                />
              </div>
              <p className="mt-2 text-xs text-[#6B7280]">Collection progress</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCell({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="bg-white px-3 py-3 md:px-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#6B7280] md:text-xs">
        {label}
      </p>
      <p
        className={`mt-1 font-serif text-lg font-medium md:text-xl ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}
