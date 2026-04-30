import type {
  Message,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages";

export interface ChatModelStreamParams {
  messages: MessageParam[];
  tools: Tool[];
  system?: string;
  onTextDelta: (delta: string) => void;
}

export interface ChatModelPort {
  stream(params: ChatModelStreamParams): Promise<Message>;
}
