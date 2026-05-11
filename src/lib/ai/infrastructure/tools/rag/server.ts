/**
 * In-process MCP server bundling the four RAG tools.
 *
 * Built per-run inside `claudeAgentSdkRunner.run()` with the request's
 * `companyId` + `embed` baked into the closure — mechanical D-17 enforcement
 * (cross-company calls are structurally impossible at the client).
 *
 * Fully-qualified tool names when delivered through `mcpServers: { rag: ... }`:
 *   mcp__rag__ls, mcp__rag__cat, mcp__rag__search, mcp__rag__find
 *
 * These strings MUST match the `tools` allowlist on the `rag` Specialist in
 * `src/lib/ai/config/specialists.ts` exactly.
 */

import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

import { createCatSdkTool } from "./cat";
import { createFindSdkTool } from "./find";
import { createLsSdkTool } from "./ls";
import { createSearchSdkTool } from "./search";
import type { RagSearchToolContext } from "./types";

export function ragServer(ctx: RagSearchToolContext) {
  return createSdkMcpServer({
    name: "rag",
    version: "1.0.0",
    tools: [
      createLsSdkTool(ctx),
      createCatSdkTool(ctx),
      createSearchSdkTool(ctx),
      createFindSdkTool(ctx),
    ],
  });
}
