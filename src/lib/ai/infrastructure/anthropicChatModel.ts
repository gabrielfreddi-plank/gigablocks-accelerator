import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages";

import type { ChatModelPort } from "@/lib/ai/ports/chatModel";

const DEFAULT_MODEL = "claude-haiku-4-5";

export class AnthropicChatModel implements ChatModelPort {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async stream(params: {
    messages: MessageParam[];
    tools: Tool[];
    onTextDelta: (delta: string) => void;
  }): Promise<Message> {
    const stream = this.client.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      messages: params.messages,
      tools: params.tools,
      ...(params.system ? { system: params.system } : {}),
    });

    stream.on("text", (textDelta) => {
      params.onTextDelta(textDelta);
    });

    return stream.finalMessage();
  }
}
