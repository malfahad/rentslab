import { AuthCtas } from "@/components/auth-ctas";
import { HeroChartOverlay } from "@/components/hero-chart-overlay";

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#243E5C] to-brand-blue"
      aria-labelledby="hero-heading"
    >
      <HeroChartOverlay />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative mx-auto max-w-content px-4 pb-24 pt-20 md:px-6 md:pb-28 md:pt-28">
        <p className="font-sans text-sm font-medium tracking-wide text-brand-gold/90">
          For property managers and landlords in East Africa
        </p>
        <h1
          id="hero-heading"
          className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.4] tracking-wide text-white md:text-5xl lg:text-[2.75rem]"
        >
          Your rent roll. Finally under control.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blue-100/90">
          Stop chasing payments across WhatsApp threads and broken spreadsheets.
          RentSlab gives you one clean view of every tenant, every unit, and
          every shilling owed.
        </p>
        <AuthCtas theme="dark" className="mt-10" />
      </div>
    </section>
  );
}
