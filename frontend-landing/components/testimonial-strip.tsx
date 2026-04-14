export function TestimonialStrip() {
  return (
    <section
      className="bg-white py-12 md:py-14"
      aria-labelledby="social-quote-heading"
    >
      <div className="mx-auto max-w-content px-4 md:px-6">
        <figure className="mx-auto max-w-3xl text-center">
          <blockquote
            id="social-quote-heading"
            className="font-serif text-xl font-medium leading-relaxed text-brand-navy md:text-2xl"
          >
            “We stopped reconciling rent manually in week one.”
          </blockquote>
          <figcaption className="mt-4 text-sm text-[#6B7280]">
            Property manager, Baguma Estates (Kampala, Uganda)
          </figcaption>
        </figure>
        <p className="mt-10 text-center text-sm text-[#374151]">
          Property managers and landlords in{" "}
          <span className="font-medium text-brand-navy">
            Kampala, Nairobi, and Kigali
          </span>{" "}
          use RentSlab.
        </p>
      </div>
    </section>
  );
}
