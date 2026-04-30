import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

import type { CanvasSpec } from "@/lib/ai/contracts/canvasSchema";
import type { ChatModelPort } from "@/lib/ai/ports/chatModel";

export function runCanvasStream(params: {
  prompt: string;
  currentSpec?: CanvasSpec | null;
  system?: string;
  chatModel: ChatModelPort;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const allowedOps = new Set([
    "add",
    "remove",
    "replace",
    "move",
    "copy",
    "test",
  ]);

  const enqueueIfValidPatchLine = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    line: string,
  ) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("```")) return;

    try {
      const parsed = JSON.parse(trimmed) as { op?: unknown; path?: unknown };
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        typeof parsed.op === "string" &&
        allowedOps.has(parsed.op) &&
        typeof parsed.path === "string"
      ) {
        controller.enqueue(encoder.encode(JSON.stringify(parsed) + "\n"));
      }
    } catch {
      // Ignore non-JSON/prose lines and keep only valid NDJSON patches.
    }
  };

  return new ReadableStream({
    async start(controller) {
      try {
        let lineBuffer = "";

        const userContent = params.currentSpec
          ? [
              "You are UPDATING an existing UI. Output ONLY valid NDJSON patches — no prose, no questions, no markdown.",
              "If the request is ambiguous, make reasonable assumptions and generate the UI anyway.",
              "Prefer targeted updates (replace/add/remove only what is needed). Do not rebuild unrelated sections.",
              "",
              `Current UI elements: ${Object.entries(
                params.currentSpec.elements,
              )
                .map(([k, v]) => `${k} (${(v as { type: string }).type})`)
                .join(", ")}`,
              "",
              `Current UI spec JSON: ${JSON.stringify(params.currentSpec)}`,
              "",
              `User request: ${params.prompt}`,
            ].join("\n")
          : params.prompt;

        const messages: MessageParam[] = [
          { role: "user", content: userContent },
        ];

        await params.chatModel.stream({
          messages,
          tools: [],
          system: params.system,
          onTextDelta: (delta) => {
            lineBuffer += delta;
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop() ?? "";

            for (const line of lines) {
              enqueueIfValidPatchLine(controller, line);
            }
          },
        });

        enqueueIfValidPatchLine(controller, lineBuffer);

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
