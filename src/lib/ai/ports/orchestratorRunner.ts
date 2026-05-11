/**
 * Orchestrator Runner Port — the boundary between the application layer
 * (`runResearchStream`, `/api/research`) and the SDK-backed orchestration
 * implementation (`ClaudeAgentSdkRunner`).
 *
 * **Boundary discipline:** this file MUST NOT import any type or runtime value
 * from `@anthropic-ai/claude-agent-sdk`. The port is pure TypeScript so the
 * application layer can depend on it without pulling the SDK into its import
 * graph. The only files allowed to import `@anthropic-ai/claude-agent-sdk` are
 * `src/lib/ai/infrastructure/claudeAgentSdkRunner.ts` and
 * `src/lib/ai/infrastructure/tools/rag/*` (plus a type-only import in
 * `src/lib/ai/config/specialists.ts` for the `AgentDefinition` shape that the
 * mapper produces).
 */

/**
 * Discriminated union of runtime events emitted by an orchestrator run.
 *
 * - `activity` — surfaces a row in the Activity column. Carries an `id` so
 *   PreToolUse + PostToolUse can share a row that transitions running→ok/error.
 * - `report-delta` — token-or-chunk of the orchestrator's final markdown report.
 * - `report-end` — terminal sentinel; the consumer closes its text stream.
 * - `run-error` — terminal error sentinel; the consumer renders a user-friendly
 *   message and closes the stream.
 */
export type RunEvent =
  | {
      kind: "activity";
      id: string;
      agent: string;
      label: string;
      ts: number;
      icon?: string;
      status?: "running" | "ok" | "error";
      durationMs?: number;
      input?: unknown;
      output?: unknown;
    }
  | { kind: "report-delta"; delta: string }
  | { kind: "report-end" }
  | { kind: "run-error"; message: string };

/**
 * The port the application layer consumes. Implementations are responsible for
 * fanning together two independent timelines into a single ordered async
 * stream of `RunEvent`s:
 *
 *  1. The SDK's `query()` message iterator (assistant text → `report-delta`,
 *     `result` → `report-end` / `run-error`).
 *  2. The hooks pipeline (`PreToolUse` / `PostToolUse` / `SubagentStart` /
 *     `SubagentStop`) — these fire on a different timeline than the message
 *     iterator and must be merged into the same stream.
 *
 * The recommended implementation pattern is an in-memory async-queue fed by
 * both producers; see `claudeAgentSdkRunner.ts` for the canonical pattern.
 *
 * @param input.query - The user's research question.
 * @param input.companyId - The Supabase company UUID; used to scope every
 *   RAG tool's reads to the requester's company.
 * @param input.userId - The Supabase auth user ID (for telemetry / audit).
 */
export interface OrchestratorRunnerPort {
  run(input: {
    query: string;
    companyId: string;
    userId: string;
  }): AsyncIterable<RunEvent>;
}
