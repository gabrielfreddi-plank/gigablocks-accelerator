import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import {
  MemoryNotFoundError,
  deleteMemory,
} from "@/lib/memory/memoryRepository";

const inputSchema = z.object({
  id: z.uuid().describe("ID of the memory to delete"),
});

export function createDeleteMemoryTool(userId: string): ToolDefinition {
  return {
    name: "delete_memory",
    description:
      "Delete a memory by ID. Use when the user explicitly asks to forget something.",
    inputSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "ID of the memory to delete",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const { id } = inputSchema.parse(input);
      try {
        await deleteMemory(userId, id);
        return { success: true };
      } catch (error) {
        if (error instanceof MemoryNotFoundError) {
          return { error: "Memory not found." };
        }
        throw error;
      }
    },
  };
}
