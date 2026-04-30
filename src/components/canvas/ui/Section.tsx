"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string | null;
  description?: string | null;
  padding?: "none" | "sm" | "md" | "lg" | null;
  gap?: "none" | "sm" | "md" | "lg" | null;
  divider?: boolean | null;
  children?: React.ReactNode;
}

const paddingStyles: Record<string, string> = {
  none: "py-0",
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
};

const gapStyles: Record<string, string> = {
  none: "gap-0",
  sm: "gap-3",
  md: "gap-6",
  lg: "gap-10",
};

export function Section({ props, children }: BaseComponentProps<SectionProps>) {
  const padding = props.padding ?? "md";
  const gap = props.gap ?? "md";

  return (
    <section
      className={cn(
        "flex w-full flex-col",
        paddingStyles[padding] ?? paddingStyles.md,
        gapStyles[gap] ?? gapStyles.md,
        props.divider && "border-b border-zinc-800",
      )}
    >
      {(props.title || props.description) && (
        <div>
          {props.title && (
            <h2 className="text-xl font-semibold text-white">{props.title}</h2>
          )}
          {props.description && (
            <p className="mt-1 text-sm text-zinc-500">{props.description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
