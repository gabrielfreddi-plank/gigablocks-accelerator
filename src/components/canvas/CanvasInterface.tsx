"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
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

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-zinc-800/70", className)} />
  );
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
  const { spec, isStreaming, send } = useUIStream({ api: "/api/canvas" });
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    send(prompt);
  };

  const hasSpec = spec != null;
  const showSkeleton = isStreaming && !hasSpec;

  return (
    <div className="flex h-[calc(100vh-69px)] w-full overflow-hidden">
      {/* Left panel — prompt */}
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

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-3">
          <label className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the interface you want to create…"
            disabled={isStreaming}
            className={cn(
              "flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900",
              "px-4 py-3 text-sm text-white placeholder-zinc-600",
              "focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40",
              "transition-colors duration-150",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium",
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
                Generate
              </>
            )}
          </button>
        </form>
      </aside>

      {/* Right panel — rendered output */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {showSkeleton ? (
          <SkeletonPreview />
        ) : hasSpec ? (
          <div className="p-6">
            <StateProvider initialState={{}}>
              <VisibilityProvider>
                <ActionProvider
                  handlers={{
                    submit: (params) => console.log("Submit:", params),
                    navigate: (params) => console.log("Navigate:", params),
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
                  Write a prompt and click Generate to get started
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
