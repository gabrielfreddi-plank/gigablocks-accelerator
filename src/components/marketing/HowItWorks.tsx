import { Section } from "@/components/marketing/Section";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { steps } from "@/lib/data/how-it-works";

export function HowItWorks() {
  return (
    <Section>
      <div className="text-center mb-16">
        <SectionLabel>How It Works</SectionLabel>
        <h2 className="text-3xl font-bold text-white">
          From idea to deployed app in under an hour.
        </h2>
      </div>

      {/* Desktop: horizontal steps */}
      <div className="hidden md:flex items-start gap-0">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Badge + connector row */}
              <div className="flex items-center w-full">
                {/* Badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-sm">
                    {step.number}
                  </span>
                </div>
                {/* Connector line (not after last item) */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-px bg-zinc-700 mx-2" />
                )}
              </div>
              {/* Text content */}
              <div className="mt-4 pr-4 w-full">
                <h3 className="text-white font-semibold text-sm mb-1">
                  {step.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical steps */}
      <div className="flex md:hidden flex-col">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-start gap-4">
            {/* Badge + vertical connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-blue-500 font-bold text-sm">
                  {step.number}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-px flex-1 bg-zinc-700 my-2 min-h-[2rem]" />
              )}
            </div>
            {/* Text content */}
            <div className="pb-8">
              <h3 className="text-white font-semibold text-sm mb-1">
                {step.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
