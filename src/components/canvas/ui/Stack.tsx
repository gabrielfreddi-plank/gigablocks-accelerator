"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface StackProps {
  direction?: "horizontal" | "vertical" | null;
  gap?: "none" | "sm" | "md" | "lg" | null;
  align?: "start" | "center" | "end" | "stretch" | null;
  justify?: "start" | "center" | "end" | "between" | null;
  wrap?: boolean | null;
  children?: React.ReactNode;
}

const gapStyles: Record<string, string> = {
  none: "gap-0",
  sm:   "gap-2",
  md:   "gap-4",
  lg:   "gap-8",
};

const alignStyles: Record<string, string> = {
  start:   "items-start",
  center:  "items-center",
  end:     "items-end",
  stretch: "items-stretch",
};

const justifyStyles: Record<string, string> = {
  start:   "justify-start",
  center:  "justify-center",
  end:     "justify-end",
  between: "justify-between",
};

export function Stack({ props, children }: BaseComponentProps<StackProps>) {
  const direction = props.direction ?? "vertical";
  const gap       = props.gap       ?? "md";
  const align     = props.align     ?? "stretch";
  const justify   = props.justify   ?? "start";

  return (
    <div
      className={cn(
        "flex w-full",
        direction === "horizontal" ? "flex-row" : "flex-col",
        gapStyles[gap]     ?? gapStyles.md,
        alignStyles[align] ?? alignStyles.stretch,
        justifyStyles[justify] ?? justifyStyles.start,
        props.wrap && "flex-wrap",
      )}
    >
      {children}
    </div>
  );
}
