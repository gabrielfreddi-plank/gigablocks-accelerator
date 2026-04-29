"use client";

import { useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquareIcon } from "lucide-react";

export function ChatInterface() {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop, error, regenerate } =
    useChat<UIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
    });

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  return (
    <div className="flex h-[80vh] flex-col">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquareIcon className="size-12" />}
              title="Start a conversation"
              description="Type a message below to begin chatting with the AI."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse
                          key={`${message.id}-${i}`}
                          controls={{ code: { copy: true, download: false } }}
                          shikiTheme={["github-light", "github-dark"]}
                          isAnimating={isBusy}
                        >
                          {part.text}
                        </MessageResponse>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      const toolPart = part as {
                        type: `tool-${string}`;
                        state: import("ai").ToolUIPart["state"];
                        input?: unknown;
                        output?: unknown;
                        errorText?: string;
                      };
                      return (
                        <Tool key={`${message.id}-${i}`}>
                          <ToolHeader
                            type={toolPart.type}
                            state={toolPart.state}
                          />
                          <ToolContent>
                            <ToolInput
                              input={
                                toolPart.input as Record<string, unknown>
                              }
                            />
                            <ToolOutput
                              output={toolPart.output}
                              errorText={toolPart.errorText}
                            />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  <span>Thinking...</span>
                </div>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error ? (
        <p className="px-1 py-2 text-sm text-red-400">
          {error.message || "Something went wrong"}
        </p>
      ) : null}

      <PromptInput onSubmit={handleSubmit} className="mt-2">
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder="Type your message..."
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            {!isBusy && messages.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regenerate()}
              >
                Regenerate
              </Button>
            ) : null}
          </PromptInputTools>
          <PromptInputSubmit
            status={status}
            onStop={stop}
            disabled={!input.trim() && !isBusy}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
