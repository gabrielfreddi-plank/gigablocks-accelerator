"use client";

import { useRef, useState } from "react";
import {
  BarChart2,
  FormInput,
  Loader2,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import {
  Renderer,
  StateProvider,
  ActionProvider,
  VisibilityProvider,
  ValidationProvider,
  useUIStream,
} from "@json-render/react";
import { componentRegistry } from "./component-registry";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    label: "Sales Dashboard",
    Icon: BarChart2,
    prompt:
      "Build a sales dashboard with KPI cards for MRR ($24.8k, +8%), ARR ($297k, +12%), and churn rate (2.1%, down). Add a bar chart for monthly revenue (Jan–Jun), a line chart for revenue trend over the same period, and a top products table with name, units sold, and revenue columns.",
  },
  {
    label: "Onboarding Form",
    Icon: FormInput,
    prompt:
      "Build a user onboarding form. Start with a welcome heading and a description. Add name (text) and email (email) inputs with validation. Add a role selector (Developer, Designer, Manager, Other) and a company size selector (1–10, 11–50, 51–200, 200+). Finish with a primary 'Get Started' submit button.",
  },
  {
    label: "Data Explorer",
    Icon: Search,
    prompt:
      "Build a data exploration tool. Include a text input for natural language queries and a Generate button. Show 3 KPI cards (Total Records, Avg Value, Anomalies). Below add a bar chart and a line chart with sample data. At the bottom a table showing sample rows.",
  },
] as const;

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-zinc-800/70", className)} />;
}

function SkeletonPreview() {
  return (
    <div className="animate-pulse space-y-5 p-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonBlock className="h-52" />
        <SkeletonBlock className="h-52" />
      </div>
      <SkeletonBlock className="h-40" />
    </div>
  );
}

export function CanvasInterface() {
  const { spec, isStreaming, error, send, clear } = useUIStream({
    api: "/api/canvas",
  });
  const [prompt, setPrompt] = useState("");
  const specRef = useRef(spec);
  specRef.current = spec;

  const doSend = (text: string) => {
    if (!text.trim() || isStreaming) return;
    const context = specRef.current
      ? { previousSpec: specRef.current }
      : undefined;
    send(text, context);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    doSend(prompt);
    setPrompt("");
  };

  const handleTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    // Start fresh — templates always generate new interface
    send(templatePrompt);
  };

  const handleFormSubmit = (params: unknown) => {
    console.log("Form submitted:", params);
    const paramsStr =
      params && typeof params === "object"
        ? Object.entries(params as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(", ")
        : String(params);

    send(
      `The user submitted the form with the following values: ${paramsStr}. Generate a confirmation or next-step page that acknowledges their input and moves the flow forward.`,
      { previousSpec: specRef.current ?? undefined },
    );
  };

  const hasSpec = spec != null;
  const showSkeleton = isStreaming && !hasSpec;

  return (
    <div className="flex h-[calc(100vh-69px)] w-full overflow-hidden">
      {/* Left panel */}
      <aside className="flex w-[340px] shrink-0 flex-col gap-6 border-r border-zinc-800 bg-zinc-950 p-6">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-400" />
            <h1 className="text-lg font-semibold text-white">Canvas</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Create beautiful interfaces with AI.
          </p>
        </div>

        {/* Templates */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Templates
          </label>
          {TEMPLATES.map(({ label, Icon, prompt: templatePrompt }) => (
            <button
              key={label}
              type="button"
              disabled={isStreaming}
              onClick={() => handleTemplate(templatePrompt)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5",
                "text-left text-sm text-zinc-300 transition-colors duration-150",
                "hover:border-zinc-700 hover:bg-zinc-800 hover:text-white",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-blue-400" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3">
          <label className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {hasSpec ? "Refine or extend" : "Prompt"}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              hasSpec
                ? "Describe what to change or add…"
                : "Describe the interface you want to create…"
            }
            disabled={isStreaming}
            className={cn(
              "flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900",
              "px-4 py-3 text-sm text-white placeholder-zinc-600",
              "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40",
              "transition-colors duration-150",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />

          <div className="flex gap-2">
            {hasSpec && !isStreaming && (
              <button
                type="button"
                onClick={() => {
                  clear();
                  setPrompt("");
                }}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5",
                  "text-sm font-medium text-zinc-400 transition-all duration-150",
                  "hover:border-zinc-600 hover:text-zinc-200",
                  "focus:outline-none focus:ring-2 focus:ring-zinc-600",
                )}
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={isStreaming || !prompt.trim()}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
                "bg-blue-600 text-white transition-all duration-150",
                "hover:bg-blue-500 active:scale-[0.98]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600",
              )}
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {hasSpec ? "Update" : "Generate"}
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-xs font-medium text-red-400">
              Generation failed
            </p>
            <p className="mt-1 text-xs text-red-400/80">{error.message}</p>
          </div>
        )}
      </aside>

      {/* Right panel */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {showSkeleton ? (
          <SkeletonPreview />
        ) : hasSpec ? (
          <div className="p-6">
            <StateProvider initialState={{}}>
              <VisibilityProvider>
                <ActionProvider
                  handlers={{
                    submit: (params) => handleFormSubmit(params),
                    navigate: (params) => {
                      const target = (params as Record<string, unknown>)
                        ?.target;
                      if (typeof target === "string") {
                        send(
                          `Navigate to: ${target}. Generate the corresponding page.`,
                          { previousSpec: specRef.current ?? undefined },
                        );
                      }
                    },
                  }}
                >
                  <ValidationProvider customFunctions={{}}>
                    <Renderer
                      spec={spec}
                      registry={componentRegistry}
                      loading={isStreaming}
                    />
                  </ValidationProvider>
                </ActionProvider>
              </VisibilityProvider>
            </StateProvider>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <Wand2 className="h-7 w-7 text-zinc-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">
                  No interface yet
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Pick a template or write a prompt to get started
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
