"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12 | null;
  gap?: string | null;
  children?: React.ReactNode;
}

const colsStyles: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  6: "grid-cols-6",
  12: "grid-cols-12",
};

const gapStyles: Record<string, string> = {
  none: "gap-0",
  sm: "gap-3",
  md: "gap-6",
  lg: "gap-10",
};

export function Grid({ props, children }: BaseComponentProps<GridProps>) {
  const cols = props.cols ?? 2;
  const gap = props.gap ?? "md";

  return (
    <div
      className={cn(
        "grid",
        colsStyles[cols] ?? colsStyles[2],
        gapStyles[gap] ?? gapStyles.md,
      )}
    >
      {children}
    </div>
  );
}
