import { ClosingCta } from "@/components/closing-cta";
import { FeatureGrid } from "@/components/feature-grid";
import { HeroSection } from "@/components/hero-section";
import { PortfolioProof } from "@/components/portfolio-proof";
import { PricingAnchor } from "@/components/pricing-anchor";
import { ProductPreview } from "@/components/product-preview";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialProof } from "@/components/social-proof";
import { TestimonialStrip } from "@/components/testimonial-strip";
import { UseCaseTabs } from "@/components/use-case-tabs";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <SocialProof />
        <ProductPreview />
        <FeatureGrid />
        <PortfolioProof />
        <TestimonialStrip />
        <UseCaseTabs />
        <PricingAnchor />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
