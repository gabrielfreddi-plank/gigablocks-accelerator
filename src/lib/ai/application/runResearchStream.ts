import { createUIMessageStream } from "ai";

/**
 * Plan 1 Walking-Skeleton stub for the Research Analyst stream.
 *
 * Emits two `data-activity` events (orchestrator + RAG specialist) and a
 * single hardcoded markdown report via `text-delta`. Plan 3 replaces this
 * function with an `OrchestratorRunnerPort`-driven implementation backed
 * by `@anthropic-ai/claude-agent-sdk`.
 *
 * Reference: PATTERNS.md §"`src/lib/ai/application/runResearchStream.ts`"
 * bullet 5 (Plan 1 stub variant) and the `runChatStream` envelope at
 * src/lib/ai/application/runChatStream.ts lines 69-95.
 *
 * **Boundary discipline:** this file MUST NOT import
 * `@anthropic-ai/claude-agent-sdk` — that import lives only in the
 * (Plan 3) infrastructure adapter.
 */
export function runResearchStream(params: {
  query: string;
  companyId: string;
  userId: string;
}) {
  // Plan 1: companyId / userId are accepted but unused in the stub. They
  // will be wired to the real runner in Plan 3.
  void params.companyId;
  void params.userId;

  return createUIMessageStream({
    execute: async ({ writer }) => {
      const now = Date.now();

      writer.write({
        type: "data-activity",
        id: crypto.randomUUID(),
        data: {
          agent: "orchestrator",
          label: "Orchestrator — preparing stub report",
          ts: now,
        },
      });

      writer.write({
        type: "data-activity",
        id: crypto.randomUUID(),
        data: {
          agent: "rag",
          label: "RAG specialist — (stub) returning hardcoded findings",
          ts: Date.now(),
        },
      });

      const textId = crypto.randomUUID();
      writer.write({ type: "text-start", id: textId });

      const reportBody =
        `## Findings\n\n` +
        `This is a stub response for the Walking Skeleton (Plan 1). ` +
        `The real orchestrator + RAG specialist ship in Plan 3.\n\n` +
        `Your query was: "${params.query}"\n\n` +
        `## Sources\n\n` +
        `_None — this is a stub. Real citations begin in Plan 3._\n`;

      writer.write({
        type: "text-delta",
        id: textId,
        delta: reportBody,
      });

      writer.write({ type: "text-end", id: textId });
    },
    onError: (e) => {
      console.error(e);
      return "Research run failed";
    },
  });
}
