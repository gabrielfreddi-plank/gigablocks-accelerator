import { tavily } from "@tavily/core";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";

const inputSchema = z.object({
  query: z
    .string()
    .min(5)
    .max(70)
    .describe("Search-optimized query string, keep under 50 characters"),
  maxResults: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .describe("Maximum number of results to return (default 5)"),
  country: z.string().optional().describe("Country to focus search on, e.g. 'brazil'"),
  startDate: z.string().optional().describe("Start date filter, format YYYY-MM-DD"),
  endDate: z.string().optional().describe("End date filter, format YYYY-MM-DD"),
});

export const webSearchTool: ToolDefinition = {
  name: "web_search",
  description:
    "Search the web for up-to-date information using Tavily. Use when the answer requires recent data or current events.",
  inputSchema,
  inputSchemaJson: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search-optimized query string, keep under 50 characters",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return (default 5, maximum 5)",
      },
      country: {
        type: "string",
        description: "Country to focus search on, e.g. 'brazil'",
      },
      startDate: {
        type: "string",
        description: "Start date filter, format YYYY-MM-DD",
      },
      endDate: {
        type: "string",
        description: "End date filter, format YYYY-MM-DD",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
  execute: async (input) => {
    const { query, maxResults, country, startDate, endDate } = inputSchema.parse(input);
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

    const client = tavily({ apiKey });
    const response = await client.search(query, {
      maxResults,
      country,
      startDate,
      endDate,
      excludeDomains: ["youtube.com", "vimeo.com", "tiktok.com", "twitch.tv"],
      searchDepth: "basic",
      timeout: 20,
      includeUsage: true,
    });

    return response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }));
  },
};
