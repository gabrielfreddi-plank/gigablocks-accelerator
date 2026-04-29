import type {
  MessageParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import { createUIMessageStream } from "ai";

import type { ChatMessage } from "@/lib/ai/contracts/chatSchema";
import type { ChatModelPort } from "@/lib/ai/ports/chatModel";
import type { ToolRegistryPort } from "@/lib/ai/ports/toolRegistry";

const MAX_TOOL_STEPS = 4;

function toTextContent(message: ChatMessage): string {
  if (
    typeof message.content === "string" &&
    message.content.trim().length > 0
  ) {
    return message.content;
  }

  if (message.parts?.length) {
    return message.parts
      .filter(
        (part): part is { type: "text"; text: string } =>
          typeof part === "object" &&
          part !== null &&
          (part as Record<string, unknown>).type === "text",
      )
      .map((part) => part.text)
      .join("\n");
  }

  return "";
}

function toAnthropicMessages(messages: ChatMessage[]): MessageParam[] {
  return messages
    .filter(
      (message): message is ChatMessage & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({
      role: message.role,
      content: toTextContent(message),
    }));
}

function serializeToolResult(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }

  return JSON.stringify(result);
}

export function runChatStream(params: {
  messages: ChatMessage[];
  chatModel: ChatModelPort;
  toolRegistry: ToolRegistryPort;
}) {
  const anthropicMessages = toAnthropicMessages(params.messages);
  const tools = params.toolRegistry.getDefinitions().map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchemaJson,
  }));

  return createUIMessageStream({
    execute: async ({ writer }) => {
      let activeTextId: string | null = null;

      for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
        const finalMessage = await params.chatModel.stream({
          messages: anthropicMessages,
          tools,
          onTextDelta: (delta) => {
            if (!activeTextId) {
              activeTextId = crypto.randomUUID();
              writer.write({ type: "text-start", id: activeTextId });
            }

            writer.write({
              type: "text-delta",
              id: activeTextId,
              delta,
            });
          },
        });

        if (activeTextId) {
          writer.write({ type: "text-end", id: activeTextId });
          activeTextId = null;
        }

        anthropicMessages.push({
          role: "assistant",
          content: finalMessage.content,
        });

        if (finalMessage.stop_reason !== "tool_use") {
          return;
        }

        const toolUseBlocks = finalMessage.content.filter(
          (block): block is ToolUseBlock => block.type === "tool_use",
        );

        if (!toolUseBlocks.length) {
          return;
        }

        const toolResultBlocks: Array<{
          type: "tool_result";
          tool_use_id: string;
          content: string;
          is_error?: boolean;
        }> = [];

        for (const toolUse of toolUseBlocks) {
          writer.write({
            type: "tool-input-start",
            toolCallId: toolUse.id,
            toolName: toolUse.name,
          });
          writer.write({
            type: "tool-input-available",
            toolCallId: toolUse.id,
            toolName: toolUse.name,
            input: toolUse.input,
          });

          const tool = params.toolRegistry.getByName(toolUse.name);

          if (!tool) {
            const errorText = `Tool '${toolUse.name}' is not allowed`;
            writer.write({
              type: "tool-output-error",
              toolCallId: toolUse.id,
              errorText,
            });

            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: errorText,
              is_error: true,
            });

            continue;
          }

          const parsedInput = tool.inputSchema.safeParse(toolUse.input);
          if (!parsedInput.success) {
            console.error(parsedInput.error.issues);
            const errorText = "Invalid tool input";
            writer.write({
              type: "tool-output-error",
              toolCallId: toolUse.id,
              errorText,
            });

            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: parsedInput.error.issues
                .map((issue) => issue.message)
                .join("\n"),
              is_error: true,
            });

            continue;
          }

          try {
            const output = await tool.execute(parsedInput.data);
            writer.write({
              type: "tool-output-available",
              toolCallId: toolUse.id,
              output,
            });

            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: serializeToolResult(output),
            });
          } catch (error) {
            const errorText = "Tool execution failed";
            writer.write({
              type: "tool-output-error",
              toolCallId: toolUse.id,
              errorText,
            });

            toolResultBlocks.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: error instanceof Error ? error.message : errorText,
              is_error: true,
            });
          }
        }

        anthropicMessages.push({
          role: "user",
          content: toolResultBlocks,
        });
      }

      writer.write({
        type: "error",
        errorText: "Maximum tool-call steps exceeded",
      });
    },
    onError: () => "Streaming failed",
  });
}
