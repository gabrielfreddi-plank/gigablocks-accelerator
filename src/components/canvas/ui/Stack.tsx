"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface StackProps {
  direction?: "horizontal" | "vertical" | null;
  gap?: "none" | "sm" | "md" | "lg" | "xl" | null;
  align?: "start" | "center" | "end" | "stretch" | null;
  justify?: "start" | "center" | "end" | "between" | "around" | null;
}

const gapMap: Record<string, string> = {
  none: "gap-0",
  sm: "gap-3",
  md: "gap-6",
  lg: "gap-10",
  xl: "gap-16",
};

const alignMap: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyMap: Record<string, string> = {
  start: "",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
};

export function Stack({ props, children }: BaseComponentProps<StackProps>) {
  const isHorizontal = props.direction === "horizontal";
  const gapClass = gapMap[props.gap ?? "md"] ?? "gap-6";
  const alignClass = alignMap[props.align ?? "start"] ?? "items-start";
  const justifyClass = justifyMap[props.justify ?? "start"] ?? "";

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "flex-row flex-wrap" : "flex-col",
        gapClass,
        alignClass,
        justifyClass,
      )}
    >
      {children}
    </div>
  );
}
