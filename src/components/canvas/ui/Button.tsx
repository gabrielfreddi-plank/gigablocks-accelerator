"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | null;
  size?: "sm" | "md" | "lg" | null;
  disabled?: boolean | null;
  fullWidth?: boolean | null;
}

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-lg",
  lg: "h-11 px-5 text-[0.9rem] rounded-xl",
};

export function Button({ props, emit }: BaseComponentProps<ButtonProps>) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  return (
    <button
      type="button"
      disabled={props.disabled ?? false}
      onClick={() => emit("press")}
      style={
        variant === "primary"
          ? { boxShadow: "0 0 14px rgba(59,130,246,0.35)" }
          : variant === "danger"
            ? { boxShadow: "0 0 12px rgba(239,68,68,0.3)" }
            : undefined
      }
      onMouseEnter={(e) => {
        if (variant === "primary")
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 24px rgba(59,130,246,0.65)";
        if (variant === "danger")
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 22px rgba(239,68,68,0.6)";
      }}
      onMouseLeave={(e) => {
        if (variant === "primary")
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 14px rgba(59,130,246,0.35)";
        if (variant === "danger")
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 12px rgba(239,68,68,0.3)";
        if (variant === "secondary" || variant === "ghost")
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-wide",
        "transition-all duration-100 ease-out",
        "active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-black",
        "disabled:pointer-events-none disabled:opacity-35",
        sizeStyles[size] ?? sizeStyles.md,
        props.fullWidth ? "w-full" : "",
        variant === "primary" && cn(
          "bg-blue-600 text-white border border-blue-500/40",
          "hover:bg-blue-500 active:bg-blue-700",
        ),
        variant === "secondary" && cn(
          "bg-transparent text-zinc-200 border border-white/15",
          "hover:bg-white/5 hover:border-white/25 active:bg-white/8",
        ),
        variant === "ghost" && cn(
          "bg-transparent text-zinc-400 border border-transparent",
          "hover:bg-white/5 hover:text-zinc-200 active:bg-white/8",
        ),
        variant === "danger" && cn(
          "bg-red-700 text-white border border-red-600/40",
          "hover:bg-red-600 active:bg-red-800",
        ),
      )}
    >
      {props.label}
    </button>
  );
}
