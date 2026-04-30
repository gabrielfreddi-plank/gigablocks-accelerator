"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface BadgeProps {
  text: string;
  variant?: "default" | "success" | "warning" | "error" | "secondary" | null;
}

const variantStyles: Record<string, string> = {
  default: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  secondary: "bg-zinc-800 text-zinc-400 border-white/10",
};

export function Badge({ props }: BaseComponentProps<BadgeProps>) {
  const variant = props.variant ?? "default";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        variantStyles[variant] ?? variantStyles.default,
      )}
    >
      {props.text}
    </span>
  );
}
