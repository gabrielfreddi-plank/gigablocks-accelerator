"use client";

/**
 * `<ActivityLogRow>` — UI-SPEC §"Streaming + Activity Log Schema".
 *
 * Renders a single activity event with a status-aware leading visual
 * (lucide icon by event-type, blue spinner while running, red AlertCircle
 * on error), an agent — em-dash — summary header, right-aligned duration,
 * and a collapsible Tool body showing input + output.
 */

import {
  AlertCircle,
  FileSearch,
  FileText,
  FolderTree,
  Search,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  Tool,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Spinner } from "@/components/ui/spinner";
import {
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type ActivityEventData = {
  agent: string;
  label: string;
  ts: number;
  icon?: string;
  status?: "running" | "ok" | "error";
  durationMs?: number;
  input?: unknown;
  output?: unknown;
};

export interface ActivityLogRowProps {
  activity: ActivityEventData;
}

const ICONS: Record<string, LucideIcon> = {
  Workflow,
  FolderTree,
  FileText,
  Search,
  FileSearch,
  Sparkles,
  AlertCircle,
};

function resolveIcon(name?: string): LucideIcon {
  if (name && ICONS[name]) return ICONS[name];
  return Sparkles;
}

export function ActivityLogRow({ activity }: ActivityLogRowProps) {
  const status = activity.status ?? "ok";
  const isRunning = status === "running";
  const isError = status === "error";

  const Leading = (() => {
    if (isRunning) return <Spinner className="text-blue-400" />;
    if (isError) return <AlertCircle className="size-4 text-red-400" />;
    const Icon = resolveIcon(activity.icon);
    return <Icon className="size-4 text-zinc-400" />;
  })();

  const durationLabel = isRunning
    ? "–"
    : typeof activity.durationMs === "number"
      ? `${activity.durationMs} ms`
      : "–";

  const summary = `${activity.label}${isRunning ? "…" : ""}`;

  return (
    <Tool className="border-zinc-800 bg-zinc-900">
      <CollapsibleTrigger
        className={cn(
          "group flex w-full items-center justify-between gap-4 p-3 text-left",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-4 shrink-0 items-center justify-center">
            {Leading}
          </span>
          <span className="truncate text-sm">
            <span className="font-medium text-zinc-300">{activity.agent}</span>
            <span className="mx-1 text-zinc-500">—</span>
            <span
              className={cn(
                isError ? "text-red-400" : "text-zinc-400",
              )}
            >
              {summary}
            </span>
          </span>
        </div>
        <span className="shrink-0 text-xs text-zinc-500">{durationLabel}</span>
      </CollapsibleTrigger>
      <ToolContent>
        {activity.input !== undefined ? (
          <ToolInput input={activity.input as Record<string, unknown>} />
        ) : null}
        {activity.output !== undefined ? (
          <ToolOutput output={activity.output} errorText={undefined} />
        ) : null}
      </ToolContent>
    </Tool>
  );
}
