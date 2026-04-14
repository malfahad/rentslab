import { AuthCtas } from "@/components/auth-ctas";

export function ClosingCta() {
  return (
    <section
      className="bg-[#152a45] py-16 md:py-20"
      aria-labelledby="closing-heading"
    >
      <div className="mx-auto max-w-content px-4 text-center md:px-6">
        <h2
          id="closing-heading"
          className="font-serif text-2xl font-medium tracking-wide text-white md:text-3xl"
        >
          Your rent roll deserves better than a spreadsheet
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-blue-100/90">
          Join property managers across East Africa who&apos;ve replaced the
          chaos with one clean system. Sign up free and see your portfolio
          clearly from day one.
        </p>
        <AuthCtas theme="dark" className="mt-8 justify-center" />
      </div>
    </section>
  );
}
