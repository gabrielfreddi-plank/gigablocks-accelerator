/**
 * ClaudeAgentSdkRunner — the ONE production file that imports
 * `@anthropic-ai/claude-agent-sdk` at runtime. Application code must depend
 * on `OrchestratorRunnerPort`, never on this class.
 *
 * Boundary discipline checklist (every key here is load-bearing — losing any
 * one of them produces a documented failure mode, see AI-SPEC pitfalls #1-#8):
 *
 *   ✔ `agent`                       — picks the orchestrator entry by slug.
 *   ✔ `agents`                      — built from the typed Specialist[].
 *   ✔ `mcpServers: { rag }`         — per-run in-process server with closure ctx.
 *   ✔ `tools: []`                   — disables built-in Read/Write/Bash/etc.
 *   ✔ `allowedTools: ["Agent",
 *                     "mcp__rag__*"]` — Agent REQUIRED or delegation
 *                                       silently fails (pitfall #1).
 *   ✔ `settingSources: []`          — do not auto-load ~/.claude / CLAUDE.md
 *                                       (pitfall #3).
 *   ✔ `maxTurns: 6`                 — orchestrator step cap.
 *   ✔ `maxBudgetUsd: 0.25`          — cost cap; trips
 *                                       `subtype === "error_max_budget_usd"`.
 *   ✔ `persistSession: false`       — ephemeral, D-21.
 *   ✔ `includeHookEvents: true`     — REQUIRED — hooks fire but no events
 *                                       emit without this (pitfall #8).
 *   ✔ `includePartialMessages: true`— enables token-level text-delta.
 *   ✔ `hooks`                       — Pre/Post ToolUse + Subagent Start/Stop.
 */

import {
  query,
  type AgentDefinition,
  type Options,
  type PostToolUseHookInput,
  type PreToolUseHookInput,
  type SDKAssistantMessage,
  type SDKMessage,
  type SDKPartialAssistantMessage,
  type SDKResultMessage,
  type SDKSystemMessage,
  type SubagentStartHookInput,
  type SubagentStopHookInput,
} from "@anthropic-ai/claude-agent-sdk";

import {
  pickOrchestratorSlug,
  specialistsToAgentsRecord,
} from "@/lib/ai/config/specialists";
import { embed } from "@/lib/ai/infrastructure/embedding/voyageEmbedding";
import { ragServer } from "@/lib/ai/infrastructure/tools/rag/server";
import type {
  OrchestratorRunnerPort,
  RunEvent,
} from "@/lib/ai/ports/orchestratorRunner";
import { createClient } from "@/lib/supabase/server";

/* -----------------------------------------------------------------------------
 * In-memory async queue — fans hook callbacks + message-iterator translations
 * into a single ordered RunEvent stream.
 * ---------------------------------------------------------------------------*/

class AsyncQueue<T> {
  private buffer: T[] = [];
  private closed = false;
  private failure: unknown = null;
  private waiter: (() => void) | null = null;

  push(item: T): void {
    if (this.closed) return;
    this.buffer.push(item);
    this.signal();
  }

  close(): void {
    this.closed = true;
    this.signal();
  }

  fail(err: unknown): void {
    this.failure = err;
    this.closed = true;
    this.signal();
  }

  private signal(): void {
    const w = this.waiter;
    this.waiter = null;
    if (w) w();
  }

  async *drain(): AsyncGenerator<T> {
    for (;;) {
      if (this.buffer.length > 0) {
        const item = this.buffer.shift() as T;
        yield item;
        continue;
      }
      if (this.closed) {
        if (this.failure) throw this.failure;
        return;
      }
      await new Promise<void>((resolve) => {
        this.waiter = resolve;
      });
    }
  }
}

/* -----------------------------------------------------------------------------
 * Label helpers
 * ---------------------------------------------------------------------------*/

function renderToolLabel(toolName: string, input: unknown): string {
  if (toolName === "Agent") {
    const subagent =
      (input as { subagent_type?: string } | null)?.subagent_type ?? "specialist";
    return `delegating to ${subagent} specialist`;
  }
  if (toolName.startsWith("mcp__rag__")) {
    const short = toolName.replace("mcp__rag__", "");
    const inp = (input ?? {}) as Record<string, unknown>;
    if (short === "ls") return `rag: ls(${String(inp.prefix ?? "/")})`;
    if (short === "cat") return `rag: cat(${String(inp.path ?? "")})`;
    if (short === "search") {
      const scope = inp.scope ? `, scope=${String(inp.scope)}` : "";
      return `rag: search("${String(inp.query ?? "")}"${scope})`;
    }
    if (short === "find") return `rag: find(${String(inp.glob ?? "")})`;
    return `rag: ${short}`;
  }
  return toolName;
}

function isMcpRagTool(name: string): boolean {
  return name === "Agent" || name.startsWith("mcp__rag__");
}

/* -----------------------------------------------------------------------------
 * Message-shape helpers (runtime introspection — the SDK Beta types are
 * structurally complex; we keep the inspection local and defensive).
 * ---------------------------------------------------------------------------*/

function extractAssistantText(msg: SDKAssistantMessage): string {
  // BetaMessage.content is an array of typed content blocks. We sum up all
  // text-block content. Cast through unknown to keep this file independent of
  // the upstream @anthropic-ai/sdk version.
  const content = (msg.message as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  let out = "";
  for (const block of content as Array<Record<string, unknown>>) {
    if (block && block.type === "text" && typeof block.text === "string") {
      out += block.text;
    }
  }
  return out;
}

function extractPartialTextDelta(msg: SDKPartialAssistantMessage): string | null {
  // SDKPartialAssistantMessage wraps a BetaRawMessageStreamEvent. The text-
  // delta variant has shape { type: 'content_block_delta', delta: { type:
  // 'text_delta', text: '...' } }. Inspect defensively.
  const ev = msg.event as unknown as {
    type?: string;
    delta?: { type?: string; text?: string };
  };
  if (
    ev &&
    ev.type === "content_block_delta" &&
    ev.delta &&
    ev.delta.type === "text_delta" &&
    typeof ev.delta.text === "string"
  ) {
    return ev.delta.text;
  }
  return null;
}

function isResultMessage(msg: SDKMessage): msg is SDKResultMessage {
  return msg.type === "result";
}

function isSystemInit(
  msg: SDKMessage,
): msg is Extract<SDKSystemMessage, { subtype: "init" }> {
  return msg.type === "system" && msg.subtype === "init";
}

function isAssistantMessage(msg: SDKMessage): msg is SDKAssistantMessage {
  return msg.type === "assistant";
}

function isPartialAssistant(
  msg: SDKMessage,
): msg is SDKPartialAssistantMessage {
  return msg.type === "stream_event";
}

/* -----------------------------------------------------------------------------
 * The adapter
 * ---------------------------------------------------------------------------*/

export interface ClaudeAgentSdkRunnerOptions {
  apiKey: string;
}

export class ClaudeAgentSdkRunner implements OrchestratorRunnerPort {
  constructor(private readonly opts: ClaudeAgentSdkRunnerOptions) {}

  async *run(input: {
    query: string;
    companyId: string;
    userId: string;
  }): AsyncIterable<RunEvent> {
    void input.userId; // currently telemetry-only; reserved for Plan 04.

    const supabase = await createClient();
    const ctx = { supabase, companyId: input.companyId, embed };

    const rag = ragServer(ctx);
    const queue = new AsyncQueue<RunEvent>();
    const toolStartTimes = new Map<string, number>();
    const toolAgentTypes = new Map<string, string>();

    // Track the active subagent type (set on SubagentStart, cleared on Stop)
    // so PreToolUse callbacks can tag tool-call rows with the right agent
    // even when raw.agent_id is unavailable.
    let activeSubagentType: string | null = null;

    const hooks: Options["hooks"] = {
      SubagentStart: [
        {
          hooks: [
            async (raw) => {
              const r = raw as SubagentStartHookInput;
              activeSubagentType = r.agent_type;
              queue.push({
                kind: "activity",
                id: crypto.randomUUID(),
                agent: r.agent_type,
                label: `${r.agent_type}: starting`,
                ts: Date.now(),
                status: "running",
              });
              return { continue: true };
            },
          ],
        },
      ],
      SubagentStop: [
        {
          hooks: [
            async (raw) => {
              const r = raw as SubagentStopHookInput;
              queue.push({
                kind: "activity",
                id: crypto.randomUUID(),
                agent: r.agent_type,
                label: `${r.agent_type}: done`,
                ts: Date.now(),
                status: "ok",
              });
              if (activeSubagentType === r.agent_type) {
                activeSubagentType = null;
              }
              return { continue: true };
            },
          ],
        },
      ],
      PreToolUse: [
        {
          hooks: [
            async (raw) => {
              const r = raw as PreToolUseHookInput;
              if (!isMcpRagTool(r.tool_name)) {
                return { continue: true };
              }
              const agent =
                r.tool_name === "Agent"
                  ? "orchestrator"
                  : (activeSubagentType ?? "rag");
              toolStartTimes.set(r.tool_use_id, Date.now());
              toolAgentTypes.set(r.tool_use_id, agent);
              queue.push({
                kind: "activity",
                id: r.tool_use_id,
                agent,
                label: renderToolLabel(r.tool_name, r.tool_input),
                ts: Date.now(),
                status: "running",
                input: r.tool_input,
              });
              return { continue: true };
            },
          ],
        },
      ],
      PostToolUse: [
        {
          hooks: [
            async (raw) => {
              const r = raw as PostToolUseHookInput;
              if (!isMcpRagTool(r.tool_name)) {
                return { continue: true };
              }
              const startedAt = toolStartTimes.get(r.tool_use_id);
              const durationMs = startedAt ? Date.now() - startedAt : undefined;
              const agent = toolAgentTypes.get(r.tool_use_id) ?? "rag";
              const resp = r.tool_response as
                | { isError?: boolean; structuredContent?: unknown; content?: unknown }
                | undefined;
              const status: "ok" | "error" = resp?.isError ? "error" : "ok";
              queue.push({
                kind: "activity",
                id: r.tool_use_id,
                agent,
                label: renderToolLabel(r.tool_name, r.tool_input),
                ts: Date.now(),
                status,
                durationMs,
                input: r.tool_input,
                output: resp?.structuredContent ?? resp?.content,
              });
              toolStartTimes.delete(r.tool_use_id);
              toolAgentTypes.delete(r.tool_use_id);
              return { continue: true };
            },
          ],
        },
      ],
    };

    const orchestratorAgents: Record<string, AgentDefinition> =
      specialistsToAgentsRecord();

    const iterator = query({
      prompt: input.query,
      options: {
        agent: pickOrchestratorSlug(),
        agents: orchestratorAgents,
        mcpServers: { rag },
        tools: [],
        allowedTools: ["Agent", "mcp__rag__ls", "mcp__rag__cat", "mcp__rag__search", "mcp__rag__find"],
        settingSources: [],
        maxTurns: 6,
        maxBudgetUsd: 0.25,
        persistSession: false,
        includeHookEvents: true,
        includePartialMessages: true,
        hooks,
        env: {
          ...process.env,
          RESEARCH_COMPANY_ID: input.companyId,
          ANTHROPIC_API_KEY: this.opts.apiKey,
        },
      },
    });

    // Track whether we received any partial text deltas so the final
    // assistant message can act as a fallback.
    let sawPartialText = false;
    let emittedReportEnd = false;

    // Non-awaited translation loop. Pushes into the same queue the hooks
    // feed; the consumer drains the merged stream below.
    (async () => {
      try {
        for await (const msg of iterator as AsyncGenerator<SDKMessage, void>) {
          if (isSystemInit(msg)) {
            console.log(
              "[research] system.init tools:",
              msg.tools,
              "mcp_servers:",
              msg.mcp_servers,
            );
            const tools = msg.tools ?? [];
            const hasAgent = tools.includes("Agent");
            const hasRag = tools.some((t) => t.startsWith("mcp__rag__"));
            if (!hasAgent || !hasRag) {
              queue.push({
                kind: "run-error",
                message:
                  "Orchestrator setup error: Agent or mcp__rag__* tools missing from the SDK tool list. Check claudeAgentSdkRunner Options.",
              });
              queue.close();
              return;
            }
            continue;
          }

          if (isPartialAssistant(msg)) {
            if (msg.parent_tool_use_id) {
              // Subagent partial text — swallow per AI-SPEC §4.
              continue;
            }
            const delta = extractPartialTextDelta(msg);
            if (delta) {
              sawPartialText = true;
              queue.push({ kind: "report-delta", delta });
            }
            continue;
          }

          if (isAssistantMessage(msg)) {
            if (msg.parent_tool_use_id) {
              // Subagent's final assistant message — swallow.
              continue;
            }
            // Only fall back to the whole-message text if partial deltas
            // never arrived (e.g. includePartialMessages truly off).
            if (!sawPartialText) {
              const text = extractAssistantText(msg);
              if (text) queue.push({ kind: "report-delta", delta: text });
            }
            continue;
          }

          if (isResultMessage(msg)) {
            if (msg.subtype !== "success") {
              queue.push({
                kind: "run-error",
                message:
                  msg.subtype === "error_max_turns"
                    ? "Research run exceeded the maximum number of orchestrator turns. Try a more focused question."
                    : msg.subtype === "error_max_budget_usd"
                      ? "Research run exceeded the cost budget. Try a more focused question."
                      : `Research run failed (${msg.subtype}).`,
              });
            }
            queue.push({ kind: "report-end" });
            emittedReportEnd = true;
            console.log("[research] result", {
              subtype: msg.subtype,
              num_turns: (msg as { num_turns?: number }).num_turns,
              total_cost_usd: (msg as { total_cost_usd?: number }).total_cost_usd,
              usage: (msg as { usage?: unknown }).usage,
              modelUsage: (msg as { modelUsage?: unknown }).modelUsage,
            });
            break;
          }
        }
        if (!emittedReportEnd) {
          queue.push({ kind: "report-end" });
        }
        queue.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        queue.push({ kind: "run-error", message: `Orchestrator run failed: ${msg}` });
        queue.close();
      }
    })();

    yield* queue.drain();
  }
}
