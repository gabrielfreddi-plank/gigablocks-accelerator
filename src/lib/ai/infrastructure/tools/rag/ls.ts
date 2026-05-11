/**
 * `mcp__rag__ls` — list the immediate children of a path prefix in the
 * company's corpus.
 *
 * Triple-export pattern (per 01-03-PLAN.md Task 2):
 *  - `runLs(args, ctx)`            — pure execution function (Vitest surface).
 *  - `createLsSdkTool(ctx)`        — SDK-form wrapper consumed by the in-process
 *                                    MCP server (`mcp__rag__ls`).
 *  - `createLsTool(ctx)`           — `ToolDefinition` shape consumed by the
 *                                    legacy `ToolRegistryPort` (Plan 4 tests).
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import { listPathsByCompany } from "@/lib/documents/documentRepository";

import type { RagToolContext } from "./types";

const lsArgsSchema = {
  prefix: z
    .string()
    .min(1)
    .startsWith("/", "Path prefix must start with '/'")
    .describe(
      "Absolute path prefix to list, e.g. '/' for the root or '/policies/hr/' for a subdirectory.",
    ),
};

const lsArgsObjectSchema = z.object(lsArgsSchema);

export interface LsArgs {
  prefix: string;
}

export interface LsEntry {
  path: string;
  kind: "file" | "dir";
}

export interface LsResult {
  entries: LsEntry[];
}

/**
 * Pure execution function. Lists immediate children of `args.prefix` within
 * the requester's company corpus.
 */
export async function runLs(
  args: LsArgs,
  ctx: RagToolContext,
): Promise<LsResult> {
  const normalised = args.prefix.endsWith("/")
    ? args.prefix
    : `${args.prefix}/`;

  // Use the full prefix to fetch matching paths. For prefix === "/" we still
  // pass it; the repository runs `like('path', '/%')`.
  const paths = await listPathsByCompany(ctx.companyId, normalised);

  const bucket = new Map<string, "file" | "dir">();
  for (const fullPath of paths) {
    if (!fullPath.startsWith(normalised)) continue;
    const tail = fullPath.slice(normalised.length);
    if (tail.length === 0) continue;

    const slashIdx = tail.indexOf("/");
    if (slashIdx === -1) {
      // No further slash — this is a file directly under the prefix.
      bucket.set(`${normalised}${tail}`, "file");
    } else {
      // First segment under the prefix is a directory.
      const dirName = tail.slice(0, slashIdx);
      bucket.set(`${normalised}${dirName}/`, "dir");
    }
  }

  return {
    entries: Array.from(bucket.entries())
      .map(([path, kind]) => ({ path, kind }))
      .sort((a, b) => a.path.localeCompare(b.path)),
  };
}

/**
 * SDK-form factory. Returned object is one of the entries in `ragServer(ctx)`.
 */
export function createLsSdkTool(ctx: RagToolContext) {
  return tool(
    "ls",
    "List the immediate children (files and synthetic directories) of an absolute path prefix in the company's document corpus. Start at '/' to learn the top-level layout.",
    lsArgsSchema,
    async (args) => {
      try {
        const parsed = lsArgsObjectSchema.parse(args);
        const out = await runLs(parsed, ctx);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(out) }],
          structuredContent: out as unknown as Record<string, unknown>,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `ls failed: ${msg}` }],
          isError: true,
        };
      }
    },
    {
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
  );
}

/**
 * ToolDefinition-form factory. Used by Plan 4 Vitest tests that route
 * through the legacy `ToolRegistryPort`.
 */
export function createLsTool(ctx: RagToolContext): ToolDefinition {
  return {
    name: "rag_ls",
    description:
      "List the immediate children of an absolute path prefix in the company's document corpus.",
    inputSchema: lsArgsObjectSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        prefix: {
          type: "string",
          description:
            "Absolute path prefix to list (must start with '/'). E.g. '/' or '/policies/hr/'.",
        },
      },
      required: ["prefix"],
      additionalProperties: false,
    },
    execute: async (input) => runLs(lsArgsObjectSchema.parse(input), ctx),
  };
}
