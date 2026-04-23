import { Section } from "@/components/marketing/Section";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { features } from "@/lib/data/features";

export function FeaturesGrid() {
  return (
    <Section>
      <div className="text-center mb-12">
        <SectionLabel>EVERYTHING YOU NEED</SectionLabel>
        <h2 className="text-4xl font-bold text-white">One platform, zero friction.</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="border border-zinc-700 bg-zinc-900 rounded-[10px] p-6 transition-colors duration-200 hover:border-zinc-600"
          >
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-zinc-400 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
