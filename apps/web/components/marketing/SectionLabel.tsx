import { cn } from "@/lib/utils";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p className={cn("text-blue-500 text-xs font-semibold tracking-widest uppercase mb-3", className)}>
      {children}
    </p>
  );
}
