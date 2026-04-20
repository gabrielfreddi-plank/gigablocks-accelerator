import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { EditorMockup } from "@/components/marketing/EditorMockup";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { ValueProps } from "@/components/marketing/ValueProps";

export default function MarketingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EditorMockup />
        <FeaturesGrid />
        <ValueProps />
      </main>
    </>
  );
}
