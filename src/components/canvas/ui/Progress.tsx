"use client";

import type { BaseComponentProps } from "@json-render/react";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number | null;
  label?: string | null;
}

export function Progress({ props }: BaseComponentProps<ProgressProps>) {
  const max = props.max ?? 100;
  const pct = Math.min(100, Math.max(0, (props.value / max) * 100));

  return (
    <div className="flex flex-col gap-2">
      {props.label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{props.label}</span>
          <span className="text-xs font-medium text-zinc-400 tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className={cn(
            "h-full rounded-full bg-blue-500 transition-all duration-500 ease-out",
            "relative overflow-hidden",
            "after:absolute after:inset-0 after:rounded-full",
            "after:[background:linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.18)_50%,transparent_100%)]",
            "after:[background-size:200%_100%]",
            "after:[animation:canvas-shimmer-sweep_1.8s_linear_infinite]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
