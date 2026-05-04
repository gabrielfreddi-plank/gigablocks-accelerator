import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import { fetchMemoriesByUser } from "@/lib/memory/memoryRepository";

const inputSchema = z.object({});

export function createFetchMemoriesTool(userId: string): ToolDefinition {
  return {
    name: "fetch_memories",
    description:
      "Fetch all memories stored about the current user. Use this to refresh your memory context mid-conversation.",
    inputSchema,
    inputSchemaJson: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    execute: async () => {
      const memories = await fetchMemoriesByUser(userId);
      return memories.map((m) => ({ id: m.id, title: m.title, content: m.content }));
    },
  };
}
