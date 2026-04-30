import { tavily } from "@tavily/core";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";

const inputSchema = z.object({
  urls: z.array(z.string()).describe("URLs to extract content from"),
});

export const urlExtractTool: ToolDefinition = {
  name: "url_extract",
  description:
    "Extract the text content of one or more URLs. Use when the user shares a link or when a search result needs deeper reading.",
  inputSchema,
  inputSchemaJson: {
    type: "object",
    properties: {
      urls: {
        type: "array",
        items: { type: "string" },
        description: "URLs to extract content from",
      },
    },
    required: ["urls"],
    additionalProperties: false,
  },
  execute: async (input) => {
    const { urls } = inputSchema.parse(input);
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("Tool is currently unavailable");

    const client = tavily({ apiKey });
    const response = await client.extract(urls, {
      includeUsage: true,
      timeout: 30,
      extractDepth: "basic",
    });

    return response.results.map((r) => ({
      title: r.title,
      url: r.url,
      raw_content: r.rawContent,
    }));
  },
};
