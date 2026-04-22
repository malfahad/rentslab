const integrations = [
  { name: "MTN Mobile Money", src: "/integrations/mtn.svg" },
  { name: "QuickBooks", src: "/integrations/quickbooks.svg" },
  { name: "Stripe", src: "/integrations/stripe.svg" },
] as const;

export function SocialProof() {
  return (
    <section
      className="border-b border-gray-200 bg-white pb-12 pt-14 md:pb-14 md:pt-16"
      aria-label="Payment and accounting connections"
    >
      <div className="mx-auto max-w-content px-4 md:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          Connects to the tools you already use
        </p>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#374151] md:text-base">
          MoMo, banks, and software your finance team already uses.
        </p>
        <ul className="mt-10 flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14">
          {integrations.map(({ name, src }) => (
            <li key={name} className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- local brand SVGs from /public */}
              <img
                src={src}
                alt={name}
                width={140}
                height={40}
                className="h-9 w-auto max-w-[min(132px,30vw)] object-contain object-center opacity-85 transition-opacity hover:opacity-100 md:h-10"
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
