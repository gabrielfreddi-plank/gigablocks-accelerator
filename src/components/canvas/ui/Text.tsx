"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface TextProps {
  text: string;
  variant?: "body" | "caption" | "muted" | "lead" | "code" | null;
}

const variantStyles: Record<string, string> = {
  body: "text-sm text-zinc-300 leading-relaxed",
  caption: "text-xs text-zinc-500",
  muted: "text-sm text-zinc-500",
  lead: "text-lg text-zinc-200 leading-relaxed",
  code: "font-mono text-sm bg-zinc-900 text-blue-300 rounded-md px-2 py-0.5 border border-white/8",
};

export function Text({ props }: BaseComponentProps<TextProps>) {
  const variant = props.variant ?? "body";
  const Tag = variant === "code" ? "code" : "p";

  return (
    <Tag className={cn(variantStyles[variant] ?? variantStyles.body)}>
      {props.text}
    </Tag>
  );
}
