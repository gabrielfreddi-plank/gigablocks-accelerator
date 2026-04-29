import type { UIMessage } from "@ai-sdk/react";

export const DEFAULT_CHAT_TITLE = "Unnamed Chat";

export type ChatSession = {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ChatSessionsState = {
  version: number;
  selectedSessionId: string | null;
  sessions: ChatSession[];
};

export function createChatSession(title: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getNextDefaultChatTitle(existingTitles: string[]): string {
  if (!existingTitles.includes(DEFAULT_CHAT_TITLE)) {
    return DEFAULT_CHAT_TITLE;
  }

  let counter = 2;
  while (existingTitles.includes(`${DEFAULT_CHAT_TITLE} (${counter})`)) {
    counter += 1;
  }

  return `${DEFAULT_CHAT_TITLE} (${counter})`;
}

export function hasDuplicateTitle(
  sessions: ChatSession[],
  candidateTitle: string,
  currentSessionId: string,
): boolean {
  return sessions.some(
    (session) =>
      session.id !== currentSessionId && session.title === candidateTitle,
  );
}

export function createDefaultChatSession(existingTitles: string[]): ChatSession {
  return createChatSession(getNextDefaultChatTitle(existingTitles));
}
