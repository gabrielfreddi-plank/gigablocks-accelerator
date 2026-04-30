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

  return new ReadableStream({
    async start(controller) {
      try {
        // Clear stale elements from the previous spec before new patches arrive.
        for (const key of Object.keys(params.currentSpec?.elements ?? {})) {
          const patch = { op: "remove", path: `/elements/${key}` };
          controller.enqueue(encoder.encode(JSON.stringify(patch) + "\n"));
        }

        let lineBuffer = "";

        const messages: MessageParam[] = [
          { role: "user", content: params.prompt },
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
              const trimmed = line.trim();
              if (trimmed) {
                controller.enqueue(encoder.encode(trimmed + "\n"));
              }
            }
          },
        });

        if (lineBuffer.trim()) {
          controller.enqueue(encoder.encode(lineBuffer.trim() + "\n"));
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
