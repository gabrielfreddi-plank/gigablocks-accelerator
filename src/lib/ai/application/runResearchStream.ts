import { createUIMessageStream } from "ai";

import type {
  OrchestratorRunnerPort,
  RunEvent,
} from "@/lib/ai/ports/orchestratorRunner";

/**
 * Application-layer adapter between the OrchestratorRunnerPort RunEvent
 * stream and the `ai` SDK's UIMessageStream protocol.
 *
 * **Boundary discipline:** this file MUST NOT import
 * `@anthropic-ai/claude-agent-sdk` — it depends only on
 * `OrchestratorRunnerPort` from the ports layer. The concrete
 * `ClaudeAgentSdkRunner` is instantiated at the route-handler boundary and
 * injected via the `runner` parameter.
 *
 * Event translation:
 *  - `activity`     → custom `data-activity` UIMessage part (consumed by the
 *                     `/research` page's Activity column).
 *  - `report-delta` → `text-delta` on a single text part (started lazily on
 *                     the first delta so an error-only run yields no empty
 *                     text part).
 *  - `report-end`   → `text-end` (only if a text part was started).
 *  - `run-error`    → `data-error` custom part; the consumer renders a
 *                     banner and stops listening.
 */
export function runResearchStream(params: {
  query: string;
  companyId: string;
  userId: string;
  runner: OrchestratorRunnerPort;
}) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      let textId: string | null = null;

      for await (const event of params.runner.run({
        query: params.query,
        companyId: params.companyId,
        userId: params.userId,
      }) as AsyncIterable<RunEvent>) {
        switch (event.kind) {
          case "activity": {
            writer.write({
              type: "data-activity",
              id: event.id,
              data: {
                agent: event.agent,
                label: event.label,
                ts: event.ts,
                status: event.status,
                durationMs: event.durationMs,
              },
            });
            break;
          }
          case "report-delta": {
            if (!textId) {
              textId = crypto.randomUUID();
              writer.write({ type: "text-start", id: textId });
            }
            writer.write({
              type: "text-delta",
              id: textId,
              delta: event.delta,
            });
            break;
          }
          case "report-end": {
            if (textId) {
              writer.write({ type: "text-end", id: textId });
              textId = null;
            }
            break;
          }
          case "run-error": {
            writer.write({
              type: "data-error",
              id: crypto.randomUUID(),
              data: { message: event.message },
            });
            if (textId) {
              writer.write({ type: "text-end", id: textId });
              textId = null;
            }
            break;
          }
        }
      }

      // Defensive close — if the runner returned without emitting report-end
      // (e.g. early break on unrecoverable error), still terminate the text
      // part cleanly.
      if (textId) {
        writer.write({ type: "text-end", id: textId });
      }
    },
    onError: (e) => {
      console.error("[runResearchStream]", e);
      return "Research run failed";
    },
  });
}
