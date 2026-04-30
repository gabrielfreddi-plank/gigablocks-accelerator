import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

import type {
  ChatModelPort,
  ChatModelStreamParams,
} from "@/lib/ai/ports/chatModel";

const DEFAULT_MODEL = "claude-haiku-4-5";
// const DEFAULT_MODEL = "claude-sonnet-4-6";

export class AnthropicChatModel implements ChatModelPort {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async stream(params: ChatModelStreamParams): Promise<Message> {
    const stream = this.client.messages.stream({
      model: DEFAULT_MODEL,
      max_tokens: 8192,
      messages: params.messages,
      ...(params.tools.length > 0 ? { tools: params.tools } : {}),
      ...(params.system ? { system: params.system } : {}),
    });

    stream.on("text", (textDelta) => {
      params.onTextDelta(textDelta);
    });

    return stream.finalMessage();
  }
}
