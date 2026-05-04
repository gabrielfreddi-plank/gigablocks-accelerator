import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import {
  MemoryTitleConflictError,
  createMemory,
} from "@/lib/memory/memoryRepository";

const inputSchema = z.object({
  title: z.string().min(1).max(100).describe("Short descriptive title for the memory"),
  content: z.string().min(1).max(1000).describe("The information to remember"),
});

export function createSaveMemoryTool(userId: string): ToolDefinition {
  return {
    name: "save_memory",
    description:
      "Save a new memory about the user. Only call this after the user has explicitly confirmed they want this information remembered. Use a short, descriptive title.",
    inputSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short descriptive title for the memory",
        },
        content: {
          type: "string",
          description: "The information to remember",
        },
      },
      required: ["title", "content"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const { title, content } = inputSchema.parse(input);
      try {
        const memory = await createMemory(userId, title, content);
        return { id: memory.id, title: memory.title, content: memory.content };
      } catch (error) {
        if (error instanceof MemoryTitleConflictError) {
          return { error: "A memory with this title already exists. Use update_memory to modify it." };
        }
        throw error;
      }
    },
  };
}
