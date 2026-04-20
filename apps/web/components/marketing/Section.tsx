import { cn } from "@/lib/utils";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
};

export function Section({ children, className }: SectionProps) {
  return (
    <section className={cn("w-full px-6 py-24 max-w-7xl mx-auto", className)}>
      {children}
    </section>
  );
}
