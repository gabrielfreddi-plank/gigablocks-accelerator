"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { MessageSquareIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import {
  createChatSession,
  createDefaultChatSession,
  getNextDefaultChatTitle,
  hasDuplicateTitle,
  type ChatSessionsState,
} from "./chatSessionsDomain";
import {
  STORAGE_VERSION,
  loadChatSessionsState,
  saveChatSessionsState,
} from "./chatSessionsStorage";

function createInitialState(): ChatSessionsState {
  const session = createDefaultChatSession([]);
  return {
    version: STORAGE_VERSION,
    selectedSessionId: session.id,
    sessions: [session],
  };
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [chatState, setChatState] = useState<ChatSessionsState>(() =>
    createInitialState(),
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    regenerate,
  } =
    useChat<UIMessage>({
      id: chatState.selectedSessionId ?? undefined,
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
    });

  const previousStatusRef = useRef(status);

  const selectedSession = useMemo(
    () =>
      chatState.sessions.find(
        (session) => session.id === chatState.selectedSessionId,
      ) ?? null,
    [chatState.sessions, chatState.selectedSessionId],
  );

  const updateChatState = useCallback(
    (updater: (previous: ChatSessionsState) => ChatSessionsState) => {
      setChatState((previous) => {
        const next = updater(previous);
        saveChatSessionsState(next);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const loaded = loadChatSessionsState();

    if (!loaded || loaded.sessions.length === 0) {
      const fallbackState = createInitialState();
      setChatState(fallbackState);
      saveChatSessionsState(fallbackState);
      return;
    }

    const selectedExists = loaded.sessions.some(
      (session) => session.id === loaded.selectedSessionId,
    );

    const hydratedState: ChatSessionsState = {
      ...loaded,
      selectedSessionId: selectedExists
        ? loaded.selectedSessionId
        : loaded.sessions[0]?.id ?? null,
    };

    setChatState(hydratedState);
  }, []);

  useEffect(() => {
    setMessages(selectedSession?.messages ?? []);
  }, [selectedSession?.id, selectedSession?.messages, setMessages]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const finishedAssistantTurn =
      (previousStatus === "streaming" || previousStatus === "submitted") &&
      status === "ready" &&
      messages.at(-1)?.role === "assistant";

    if (finishedAssistantTurn) {
      updateChatState((previous) => {
        if (!previous.selectedSessionId) return previous;

        const updatedSessions = previous.sessions.map((session) =>
          session.id === previous.selectedSessionId
            ? {
                ...session,
                messages,
                updatedAt: new Date().toISOString(),
              }
            : session,
        );

        return {
          ...previous,
          sessions: updatedSessions,
        };
      });
    }

    previousStatusRef.current = status;
  }, [messages, status, updateChatState]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text.trim()) return;
    setSessionError(null);
    sendMessage({ text: message.text });
    setInput("");
  };

  const handleCreateSession = () => {
    setSessionError(null);

    const defaultTitle = getNextDefaultChatTitle(
      chatState.sessions.map((session) => session.title),
    );
    const maybeTitle = window.prompt("Choose a title for your chat", defaultTitle);
    if (maybeTitle === null) return;

    const title = maybeTitle.trim() || defaultTitle;
    const duplicate = chatState.sessions.some((session) => session.title === title);
    if (duplicate) {
      setSessionError("A chat with this title already exists.");
      return;
    }

    updateChatState((previous) => {
      const newSession = createChatSession(title);

      return {
        ...previous,
        selectedSessionId: newSession.id,
        sessions: [...previous.sessions, newSession],
      };
    });
  };

  const handleSelectSession = (sessionId: string) => {
    setSessionError(null);
    updateChatState((previous) => ({
      ...previous,
      selectedSessionId: sessionId,
    }));
  };

  const handleRenameSession = (sessionId: string) => {
    const session = chatState.sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const maybeTitle = window.prompt("Rename chat", session.title);
    if (maybeTitle === null) return;

    const title = maybeTitle.trim();
    if (!title) {
      setSessionError("Chat title cannot be empty.");
      return;
    }

    if (hasDuplicateTitle(chatState.sessions, title, sessionId)) {
      setSessionError("A chat with this title already exists.");
      return;
    }

    setSessionError(null);
    updateChatState((previous) => ({
      ...previous,
      sessions: previous.sessions.map((item) =>
        item.id === sessionId
          ? { ...item, title, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
  };

  const handleDeleteSession = (sessionId: string) => {
    const session = chatState.sessions.find((item) => item.id === sessionId);
    if (!session) return;

    const shouldDelete = window.confirm(
      `Delete chat "${session.title}"? This action cannot be undone.`,
    );
    if (!shouldDelete) return;

    setSessionError(null);
    updateChatState((previous) => {
      const remainingSessions = previous.sessions.filter(
        (item) => item.id !== sessionId,
      );

      if (remainingSessions.length === 0) {
        const fallbackSession = createDefaultChatSession([]);
        return {
          ...previous,
          selectedSessionId: fallbackSession.id,
          sessions: [fallbackSession],
        };
      }

      const selectedSessionId =
        previous.selectedSessionId === sessionId
          ? remainingSessions[0]?.id ?? null
          : previous.selectedSessionId;

      return {
        ...previous,
        selectedSessionId,
        sessions: remainingSessions,
      };
    });
  };

  return (
    <div className="grid h-[80vh] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="flex h-full flex-col rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        <Button onClick={handleCreateSession} className="mb-3 w-full">
          <PlusIcon className="mr-2 size-4" />
          New Chat
        </Button>

        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {chatState.sessions.map((session) => {
            const isActive = session.id === chatState.selectedSessionId;

            return (
              <div
                key={session.id}
                className={`rounded-md border p-2 ${
                  isActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-900/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectSession(session.id)}
                  className="w-full text-left text-sm font-medium text-zinc-100"
                >
                  {session.title}
                </button>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRenameSession(session.id)}
                  >
                    <PencilIcon className="mr-1 size-3.5" />
                    Rename
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <TrashIcon className="mr-1 size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <div className="flex h-full flex-col">
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
                                input={toolPart.input as Record<string, unknown>}
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
        {sessionError ? (
          <p className="px-1 py-2 text-sm text-red-400">{sessionError}</p>
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
    </div>
  );
}
