"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface HeadingProps {
  text: string;
  level?: "h1" | "h2" | "h3" | "h4" | null;
}

const levelStyles: Record<string, string> = {
  h1: "text-4xl font-bold text-white tracking-tight",
  h2: "text-3xl font-semibold text-white tracking-tight",
  h3: "text-xl font-semibold text-white",
  h4: "text-base font-medium text-zinc-200",
};

export function Heading({ props }: BaseComponentProps<HeadingProps>) {
  const level = props.level ?? "h2";
  const Tag = level as "h1" | "h2" | "h3" | "h4";

  return (
    <Tag className={cn(levelStyles[level] ?? levelStyles.h2)}>
      {props.text}
    </Tag>
  );
}
