"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface CardProps {
  title?: string | null;
  description?: string | null;
  maxWidth?: "sm" | "md" | "lg" | "full" | null;
  centered?: boolean | null;
  className?: string | null;
  children?: React.ReactNode;
}

const maxWidthStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "w-full",
};

export function Card({ props, children }: BaseComponentProps<CardProps>) {
  return (
    <div
      className={cn(
        "bg-zinc-950 border border-white/8 rounded-2xl p-6",
        maxWidthStyles[props.maxWidth ?? "full"] ?? "w-full",
        props.centered && "mx-auto",
        props.className,
      )}
    >
      {props.title && (
        <p className="text-base font-semibold text-white">{props.title}</p>
      )}
      {props.description && (
        <p className="text-sm text-zinc-500 mt-0.5 mb-4">{props.description}</p>
      )}
      {children}
    </div>
  );
}
