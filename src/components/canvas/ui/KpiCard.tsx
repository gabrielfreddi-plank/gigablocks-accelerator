"use client";

import type { BaseComponentProps } from "@json-render/react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string | null;
  trend?: "up" | "down" | "neutral" | null;
  trendValue?: string | null;
  description?: string | null;
}

const trendConfig = {
  up: {
    icon: TrendingUp,
    classes: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  down: {
    icon: TrendingDown,
    classes: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  neutral: {
    icon: Minus,
    classes: "text-zinc-400 bg-zinc-800 border-white/10",
  },
};

export function KpiCard({ props }: BaseComponentProps<KpiCardProps>) {
  const trend = props.trend ?? null;
  const config = trend ? trendConfig[trend] : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-zinc-950 p-5">
      <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        {props.label}
      </span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tabular-nums text-white leading-none">
          {props.value}
        </span>
        {props.unit && (
          <span className="text-lg text-zinc-500 leading-none">
            {props.unit}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {config && props.trendValue && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
              config.classes,
            )}
          >
            <config.icon className="h-3 w-3" />
            {props.trendValue}
          </span>
        )}
        {props.description && (
          <span className="text-xs text-zinc-600">{props.description}</span>
        )}
      </div>
    </div>
  );
}
