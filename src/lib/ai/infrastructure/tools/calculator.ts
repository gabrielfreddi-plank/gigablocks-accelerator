import { evaluate } from "mathjs";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";

const inputSchema = z.object({
  expression: z
    .string()
    .describe("Math expression to evaluate, e.g. '2 * (3 + 4)'"),
});

export const calculatorTool: ToolDefinition = {
  name: "calculator",
  description:
    "Evaluate a mathematical expression using mathjs. Use for arithmetic, algebra, unit conversions, and statistics.",
  inputSchema,
  inputSchemaJson: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Math expression to evaluate, e.g. '2 * (3 + 4)'",
      },
    },
    required: ["expression"],
    additionalProperties: false,
  },
  execute: async (input) => {
    const { expression } = inputSchema.parse(input);
    const result = evaluate(expression);
    return { result: String(result) };
  },
};
