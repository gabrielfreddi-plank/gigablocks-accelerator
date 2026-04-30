"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string | null;
  description?: string | null;
  padding?: "none" | "sm" | "md" | "lg" | null;
  divider?: boolean | null;
  children?: React.ReactNode;
}

const paddingStyles: Record<string, string> = {
  none: "py-0",
  sm:   "py-4",
  md:   "py-8",
  lg:   "py-12",
};

export function Section({ props, children }: BaseComponentProps<SectionProps>) {
  const padding = props.padding ?? "md";

  return (
    <section
      className={cn(
        "w-full",
        paddingStyles[padding] ?? paddingStyles.md,
        props.divider && "border-b border-zinc-800",
      )}
    >
      {(props.title || props.description) && (
        <div className="mb-6">
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
