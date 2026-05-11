"use client";

import { useMemo, useState } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import Link from "next/link";
import { use } from "react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  ActivityLogRow,
  type ActivityEventData,
} from "@/components/research/ActivityLogRow";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function ResearchPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/research",
        prepareSendMessagesRequest: ({ messages }) => {
          const lastUser = [...messages].reverse().find(
            (m) => m.role === "user",
          );
          const queryText = lastUser?.parts
            .filter(
              (p): p is { type: "text"; text: string } =>
                p.type === "text" && typeof (p as { text?: unknown }).text === "string",
            )
            .map((p) => p.text)
            .join("\n") ?? "";

          return {
            body: {
              query: queryText,
              companyId,
            },
          };
        },
      }),
    [companyId],
  );

  const { messages, sendMessage, status, stop, error } = useChat<UIMessage>({
    transport,
  });

  const [input, setInput] = useState("");
  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    sendMessage({ text: message.text });
    setInput("");
  };

  const lastMessage = messages.at(-1);
  type ActivityPart = {
    type: "data-activity";
    id?: string;
    data?: Partial<ActivityEventData>;
  };

  const activityParts: ActivityPart[] =
    lastMessage?.role === "assistant"
      ? (lastMessage.parts.filter(
          (p) => (p as { type?: unknown }).type === "data-activity",
        ) as ActivityPart[])
      : [];

  const reportText =
    lastMessage?.role === "assistant"
      ? lastMessage.parts
          .filter(
            (p): p is { type: "text"; text: string } =>
              p.type === "text" &&
              typeof (p as { text?: unknown }).text === "string",
          )
          .map((p) => p.text)
          .join("")
      : "";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 bg-zinc-950 px-6 py-8 font-sans text-zinc-200">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          RESEARCH ANALYST
        </p>
        <h1 className="text-xl font-semibold text-zinc-200">
          Research analyst
        </h1>
        <p className="text-sm text-zinc-500">
          Ask a question about your company&apos;s documents and the analyst
          will explore the corpus and cite its sources.
        </p>
      </div>

      {error ? (
        <div className="rounded-[10px] border border-red-800 bg-red-950/40 px-5 py-3">
          <p className="text-sm font-medium text-red-400">
            Research run failed.
          </p>
          <p className="mt-1 text-sm text-red-300">
            {error.message || "Try the question again or shorten it."}
          </p>
        </div>
      ) : null}

      {error && /no documents/i.test(error.message ?? "") ? (
        <div className="rounded-[10px] border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <p className="text-sm font-medium text-zinc-200">
            No documents in your corpus yet.
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Add at least one document before running research.{" "}
            <Link
              href={`/documents/${companyId}/add-document`}
              className="text-blue-400 underline hover:text-blue-300"
            >
              Add a document
            </Link>
          </p>
        </div>
      ) : null}

      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            placeholder='Ask a research question — e.g. "Summarize our remote-work policy across all 2024 documents."'
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            {isBusy ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={stop}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Stop
              </Button>
            ) : null}
          </PromptInputTools>
          <PromptInputSubmit
            status={status}
            onStop={stop}
            disabled={!input.trim() && !isBusy}
            size="sm"
            className="bg-blue-600 px-4 text-white hover:bg-blue-500"
          >
            {status === "submitted" || status === "streaming" ? (
              <span className="flex items-center gap-2">
                <Spinner /> Researching…
              </span>
            ) : (
              "Run research"
            )}
          </PromptInputSubmit>
        </PromptInputFooter>
      </PromptInput>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <section className="flex flex-col gap-3 rounded-[10px] border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="text-base font-semibold text-zinc-300">Activity</h2>
          {activityParts.length === 0 ? (
            <p className="text-sm text-zinc-500">
              The analyst&apos;s tool calls and decisions will appear here once
              you submit a question.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {activityParts.map((part, i) => {
                const data: ActivityEventData = {
                  agent:
                    typeof part.data?.agent === "string"
                      ? part.data.agent
                      : "agent",
                  label:
                    typeof part.data?.label === "string"
                      ? part.data.label
                      : "(activity)",
                  ts:
                    typeof part.data?.ts === "number" ? part.data.ts : 0,
                  icon: part.data?.icon,
                  status: part.data?.status,
                  durationMs: part.data?.durationMs,
                  input: part.data?.input,
                  output: part.data?.output,
                };
                return (
                  <ActivityLogRow
                    key={part.id ?? i}
                    activity={data}
                  />
                );
              })}
              {isBusy ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500">
                  <Spinner className="text-blue-400" />
                  <span>working…</span>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-[10px] border border-zinc-800 bg-zinc-900/60 p-6">
          {reportText.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <h2 className="text-base font-semibold text-zinc-300">
                Submit a question to begin.
              </h2>
              <p className="text-sm text-zinc-500">
                Drafts will stream here. Each claim will be cited with a
                numbered footnote linking back to the source document.
              </p>
            </div>
          ) : (
            <>
              {isBusy ? (
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Spinner className="text-blue-400" />
                  <span>Researching…</span>
                </div>
              ) : null}
              <Streamdown>{reportText}</Streamdown>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
