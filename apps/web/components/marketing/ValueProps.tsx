import { Section } from "@/components/marketing/Section";

const values = [
  { highlight: "< 5 min", description: "to ship your first internal tool" },
  { highlight: "Zero", description: "infrastructure to manage" },
  { highlight: "One", description: "platform for UI, API, and AI" },
  { highlight: "Free", description: "during the entire open beta" },
] as const;

export function ValueProps() {
  return (
    <div className="w-full border-t border-zinc-700">
      <Section className="py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {values.map((item, index) => (
            <div
              key={item.highlight}
              className={
                "flex flex-col gap-1 px-6 py-6" +
                (index !== 0 ? " border-l border-zinc-700" : "")
              }
            >
              <span className="font-extrabold text-[40px] leading-none tracking-tight">
                {item.highlight}
              </span>
              <span className="text-zinc-500 text-[13px] leading-snug">
                {item.description}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
