import type { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  inputSchemaJson: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  execute: (input: unknown) => Promise<unknown>;
}

export interface ToolRegistryPort {
  getDefinitions(): ToolDefinition[];
  getByName(name: string): ToolDefinition | null;
}
