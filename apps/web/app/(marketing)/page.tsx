import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { EditorMockup } from "@/components/marketing/EditorMockup";

export default function MarketingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <EditorMockup />
      </main>
    </>
  );
}
