import type { Memory } from "@/lib/memory/memoryRepository";

const BASE_SYSTEM =
  "You're a helpful assistant, that answers directly and shortly.\n\n" +
  "When the user shares personal preferences, facts about themselves, or asks you to remember something, " +
  "first confirm with them in plain text before calling save_memory. " +
  "When updating or deleting a memory, confirm the user's intent first.";

export const MEMORY_TOOL_NAMES = new Set([
  "fetch_memories",
  "save_memory",
  "update_memory",
  "delete_memory",
]);

export function buildSystemPrompt(memories: Memory[]): string {
  if (memories.length === 0) return BASE_SYSTEM;

  const memoryBlock = memories
    .map((m) => `[id: ${m.id}] ${m.title}: ${m.content}`)
    .join("\n");

  return `${BASE_SYSTEM}\n\n## Your memories about this user:\n${memoryBlock}`;
}
