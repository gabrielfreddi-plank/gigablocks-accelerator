import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import {
  MemoryNotFoundError,
  MemoryTitleConflictError,
  updateMemory,
} from "@/lib/memory/memoryRepository";

const inputSchema = z.object({
  id: z.uuid().describe("ID of the memory to update"),
  title: z.string().min(1).max(100).describe("New title for the memory"),
  content: z.string().min(1).max(1000).describe("New content for the memory"),
});

export function createUpdateMemoryTool(userId: string): ToolDefinition {
  return {
    name: "update_memory",
    description:
      "Update an existing memory by ID. Use the memory ID from the current context. Provide the full new title and content.",
    inputSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the memory to update",
        },
        title: {
          type: "string",
          description: "New title for the memory",
        },
        content: {
          type: "string",
          description: "New content for the memory",
        },
      },
      required: ["id", "title", "content"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const { id, title, content } = inputSchema.parse(input);
      try {
        const memory = await updateMemory(userId, id, title, content);
        return { id: memory.id, title: memory.title, content: memory.content };
      } catch (error) {
        if (error instanceof MemoryNotFoundError) {
          return { error: "Memory not found." };
        }
        if (error instanceof MemoryTitleConflictError) {
          return { error: "A memory with this title already exists." };
        }
        throw error;
      }
    },
  };
}
