"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  width?: string | null;
  height?: string | null;
  rounded?: boolean | null;
}

export function Skeleton({ props }: BaseComponentProps<SkeletonProps>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-800/60",
        props.rounded ? "rounded-full" : "rounded-lg",
      )}
      style={{
        width: props.width ?? "100%",
        height: props.height ?? "1rem",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "canvas-shimmer-sweep 1.6s linear infinite",
        }}
      />
    </div>
  );
}
