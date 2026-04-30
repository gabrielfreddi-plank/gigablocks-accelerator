"use client";

import type { BaseComponentProps } from "@json-render/react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

interface LineChartProps {
  title?: string | null;
  data: Array<{ label: string; value: number }>;
  color?: "blue" | "emerald" | "violet" | "amber" | "rose" | null;
  showArea?: boolean | null;
}

const colorMap: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

const tooltipStyle = {
  backgroundColor: "#09090b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
};

const tickStyle = { fill: "#52525b", fontSize: 11 };
const gradientId = "canvas-line-fill";

export function LineChart({ props }: BaseComponentProps<LineChartProps>) {
  const color = colorMap[props.color ?? "blue"] ?? colorMap.blue;
  const showArea = props.showArea !== false;
  const chartData = (props.data ?? []).map((d) => ({
    name: d.label,
    value: d.value,
  }));

  return (
    <div className="flex flex-col gap-3">
      {props.title && (
        <p className="text-sm font-medium text-zinc-300">{props.title}</p>
      )}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={props.title ? 176 : 192}>
          <RechartsAreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={showArea ? `url(#${gradientId})` : "none"}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
