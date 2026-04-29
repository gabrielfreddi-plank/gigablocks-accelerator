"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from "ai";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function ToolInvocationCard({ part }: { part: Record<string, unknown> }) {
  const type = typeof part.type === "string" ? part.type : "tool-unknown";
  const toolName = type.startsWith("tool-") ? type.slice(5) : type;
  const state =
    typeof part.state === "string" ? part.state : "input-available";

  const inputText =
    "input" in part ? JSON.stringify(part.input, null, 2) : undefined;
  const outputText =
    "output" in part ? JSON.stringify(part.output, null, 2) : undefined;
  const errorText =
    "errorText" in part && typeof part.errorText === "string"
      ? part.errorText
      : undefined;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Tool: {toolName}
      </p>
      <p className="mt-1 text-xs text-zinc-500">State: {state}</p>

      {inputText ? (
        <pre className="mt-3 overflow-x-auto rounded bg-zinc-950 p-2 text-xs text-zinc-300">
          {inputText}
        </pre>
      ) : null}

      {outputText ? (
        <pre className="mt-2 overflow-x-auto rounded bg-zinc-950 p-2 text-xs text-zinc-200">
          {outputText}
        </pre>
      ) : null}

      {errorText ? (
        <p className="mt-2 text-xs text-red-400">{errorText}</p>
      ) : null}
    </div>
  );
}

function MessageBubble({ role, text }: { role: string; text: string }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-zinc-800 bg-zinc-900 text-zinc-100"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error, regenerate } = useChat<UIMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const isBusy = status === "submitted" || status === "streaming";

  const renderedMessages = useMemo(() => {
    return messages.map((message) => {
      const text = message.parts
        .filter((part) => isTextUIPart(part))
        .map((part) => part.text)
        .join("");
      const toolParts = message.parts.filter((part) => isToolUIPart(part));

      if (!text.trim() && toolParts.length === 0) {
        return null;
      }

      return (
        <div key={message.id} className="space-y-2">
          {text.trim() ? (
            <MessageBubble role={message.role} text={text} />
          ) : null}

          {toolParts.map((part, index) => (
            <ToolInvocationCard
              key={`${message.id}-tool-${index}`}
              part={part as unknown as Record<string, unknown>}
            />
          ))}
        </div>
      );
    });
  }, [messages]);

  useEffect(() => {
    if (!scrollAreaRef.current) {
      return;
    }

    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }, [messages]);

  async function submitMessage() {
    const text = input.trim();
    if (!text || isBusy) {
      return;
    }

    setInput("");
    await sendMessage({ text });
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950/60">
      <CardHeader>
        <CardTitle className="text-xl text-zinc-100">Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex h-[70vh] flex-col gap-4">
        <div
          ref={scrollAreaRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950 p-4"
        >
          {renderedMessages.some(Boolean) ? (
            renderedMessages
          ) : (
            <p className="text-sm text-zinc-500">
              Start a conversation by sending your first message.
            </p>
          )}
        </div>

        {error ? (
          <p className="text-sm text-red-400">
            {error.message || "Failed to send message"}
          </p>
        ) : null}

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await submitMessage();
          }}
          className="flex flex-col gap-3"
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={async (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                await submitMessage();
              }
            }}
            placeholder="Type your message..."
            className="min-h-24 resize-none border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-600"
            disabled={isBusy}
          />

          <div className="flex justify-end gap-2">
            {isBusy ? (
              <Button type="button" variant="ghost" onClick={() => stop()}>
                Stop
              </Button>
            ) : null}
            {!isBusy && messages.length > 0 ? (
              <Button type="button" variant="outline" onClick={() => regenerate()}>
                Regenerate
              </Button>
            ) : null}
            <Button type="submit" disabled={isBusy || !input.trim()}>
              {isBusy ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
