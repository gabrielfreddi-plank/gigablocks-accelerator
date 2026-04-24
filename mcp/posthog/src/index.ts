/**
 * MCP Server — PostHog Analytics (gigablocks-accelerator)
 *
 * Connects to the PostHog REST API to query events and definitions.
 *
 * Required environment variables:
 *   POSTHOG_API_KEY    — Personal API key from PostHog settings
 *   POSTHOG_PROJECT_ID — Numeric project ID (found in project settings URL)
 *
 * Optional:
 *   POSTHOG_HOST       — Defaults to https://app.posthog.com (use https://eu.posthog.com for EU cloud)
 *
 * Tools:
 *   get-events           — Query recent events by name, user, or time range
 *   get-event-definitions — List all defined events and their properties
 *   check-event-fired    — Verify if a specific event was captured in the last N minutes
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { POSTHOG_API_KEY, POSTHOG_HOST, POSTHOG_PROJECT_ID } from "./environment.js";

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function posthogGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostHog API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "gigablocks-posthog",
  version: "1.0.0",
  description: "Query PostHog analytics events and definitions",
});

// ---------------------------------------------------------------------------
// TOOL: get-events
// Query recent events by name, distinct_id, or time range.
// ---------------------------------------------------------------------------
server.registerTool(
  "get-events",
  {
    description:
      "Query recent events from PostHog. Filter by event name, user distinct_id, or time range. " +
      "Returns event list with properties, timestamps, and person info.",
    inputSchema: {
      event: z
        .string()
        .optional()
        .describe("Filter by event name. E.g: '$pageview', 'user_signed_up'"),
      distinct_id: z
        .string()
        .optional()
        .describe("Filter by user distinct_id (PostHog user identifier)"),
      after: z
        .string()
        .optional()
        .describe("ISO 8601 datetime — return events after this timestamp. E.g: '2024-01-01T00:00:00Z'"),
      before: z
        .string()
        .optional()
        .describe("ISO 8601 datetime — return events before this timestamp"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Max number of events to return (1–100, default 20)"),
    },
  },
  async ({ event, distinct_id, after, before, limit }) => {
    try {
      const params: Record<string, string> = { limit: String(limit) };
      if (event) params.event = event;
      if (distinct_id) params.distinct_id = distinct_id;
      if (after) params.after = after;
      if (before) params.before = before;

      const data = await posthogGet<{ results: unknown[]; next: string | null }>("/events/", params);

      if (data.results.length === 0) {
        return {
          content: [{ type: "text", text: "✅ No events found for the given filters." }],
        };
      }

      const hasMore = !!data.next;
      const lines = [
        `✅ ${data.results.length} event(s) returned${hasMore ? " (more available — narrow filters or reduce time range)" : ""}.`,
        "```json",
        JSON.stringify(data.results, null, 2),
        "```",
      ];

      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error fetching events:\n${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// TOOL: get-event-definitions
// List all defined events and their properties in the project.
// ---------------------------------------------------------------------------
server.registerTool(
  "get-event-definitions",
  {
    description:
      "List all event definitions registered in PostHog, including their names, descriptions, and last seen timestamps. " +
      "Use this to discover which events exist before querying them.",
    inputSchema: {
      search: z
        .string()
        .optional()
        .describe("Filter event definitions by name substring. E.g: 'sign' matches 'user_signed_up'"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .default(50)
        .describe("Max number of definitions to return (1–200, default 50)"),
    },
  },
  async ({ search, limit }) => {
    try {
      const params: Record<string, string> = { limit: String(limit) };
      if (search) params.search = search;

      const data = await posthogGet<{
        results: Array<{ name: string; description?: string; last_seen_at?: string; volume_30_day?: number }>;
        count: number;
      }>("/event_definitions/", params);

      if (data.results.length === 0) {
        return {
          content: [{ type: "text", text: "✅ No event definitions found." }],
        };
      }

      const lines = [
        `✅ ${data.results.length}/${data.count} event definition(s):`,
        "",
        "| Event | Last Seen | 30d Volume |",
        "|-------|-----------|------------|",
        ...data.results.map((e) =>
          `| \`${e.name}\` | ${e.last_seen_at ? new Date(e.last_seen_at).toISOString().slice(0, 10) : "—"} | ${e.volume_30_day ?? "—"} |`,
        ),
      ];

      if (data.results.length < data.count) {
        lines.push(`\nℹ️  ${data.count - data.results.length} more definitions — use \`search\` to narrow down.`);
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error fetching event definitions:\n${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// TOOL: check-event-fired
// Verify if a specific event was captured in the last N minutes.
// ---------------------------------------------------------------------------
server.registerTool(
  "check-event-fired",
  {
    description:
      "Check whether a specific event was captured in PostHog within the last N minutes. " +
      "Returns a boolean result, the count found, and up to 5 sample occurrences.",
    inputSchema: {
      event: z.string().describe("Exact event name to check. E.g: 'user_signed_up'"),
      minutes: z
        .number()
        .int()
        .min(1)
        .max(10080)
        .default(60)
        .describe("Look-back window in minutes (default 60, max 10080 = 7 days)"),
      distinct_id: z
        .string()
        .optional()
        .describe("Optionally scope the check to a specific user distinct_id"),
    },
  },
  async ({ event, minutes, distinct_id }) => {
    try {
      const after = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      const params: Record<string, string> = { event, after, limit: "5" };
      if (distinct_id) params.distinct_id = distinct_id;

      const data = await posthogGet<{ results: unknown[]; next: string | null }>("/events/", params);

      const found = data.results.length > 0;
      const hasMore = !!data.next;

      const userScope = distinct_id ? ` for user \`${distinct_id}\`` : "";
      const status = found ? "✅ YES — event was fired" : "❌ NO — event was NOT fired";

      const lines = [
        `${status}: \`${event}\`${userScope} in the last ${minutes} minute(s).`,
      ];

      if (found) {
        lines.push(`Found ${hasMore ? "5+" : data.results.length} occurrence(s).`);
        lines.push("**Sample occurrences:**");
        lines.push("```json");
        lines.push(JSON.stringify(data.results, null, 2));
        lines.push("```");
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error checking event:\n${(err as Error).message}` }],
        isError: true,
      };
    }
  },
);

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp-posthog] ✅ MCP Server connected to PostHog via stdio");
}

main().catch((err) => {
  console.error("[mcp-posthog] ❌ Fatal error:", err);
  process.exit(1);
});
