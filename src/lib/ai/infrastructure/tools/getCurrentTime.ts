import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";

const inputSchema = z.object({
  timezone: z
    .string()
    .default("UTC")
    .describe("IANA timezone, e.g. America/Sao_Paulo"),
});

export const getCurrentTimeTool: ToolDefinition = {
  name: "get_current_time",
  description: "Get current server time in a specific timezone",
  inputSchema,
  inputSchemaJson: {
    type: "object",
    properties: {
      timezone: {
        type: "string",
        description: "IANA timezone, e.g. America/Sao_Paulo",
      },
    },
    required: [],
    additionalProperties: false,
  },
  execute: async (input) => {
    const { timezone } = inputSchema.parse(input);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return { iso: formatter.format(new Date()) };
  },
};
