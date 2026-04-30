"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | null;
  label?: string | null;
}

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ props }: BaseComponentProps<SpinnerProps>) {
  const size = props.size ?? "md";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "rounded-full border-zinc-700 border-t-blue-500 animate-spin",
          sizeStyles[size] ?? sizeStyles.md,
        )}
      />
      {props.label && (
        <span className="text-sm text-zinc-500">{props.label}</span>
      )}
    </div>
  );
}
