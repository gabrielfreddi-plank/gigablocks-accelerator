import type { UIMessage } from "@ai-sdk/react";

import type { ChatSession, ChatSessionsState } from "./chatSessionsDomain";

const STORAGE_KEY = "gigablocks.chat.sessions";
const STORAGE_VERSION = 1;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidMessages(value: unknown): value is UIMessage[] {
  return Array.isArray(value);
}

function isValidSession(value: unknown): value is ChatSession {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isValidMessages(value.messages)
  );
}

function sanitizeState(value: unknown): ChatSessionsState | null {
  if (!isObject(value)) return null;
  if (value.version !== STORAGE_VERSION) return null;
  if (!Array.isArray(value.sessions)) return null;

  const sessions = value.sessions.filter(isValidSession);
  const selectedSessionId =
    typeof value.selectedSessionId === "string" ? value.selectedSessionId : null;

  return {
    version: STORAGE_VERSION,
    selectedSessionId,
    sessions,
  };
}

export function loadChatSessionsState(): ChatSessionsState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return sanitizeState(parsed);
  } catch {
    return null;
  }
}

export function saveChatSessionsState(state: ChatSessionsState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { STORAGE_KEY, STORAGE_VERSION };
