/**
 * `mcp__rag__cat` — fetch the full content of a single document by absolute
 * path, scoped to the requester's company.
 *
 * Triple-export: `runCat` (pure) + `createCatSdkTool` (SDK-form) +
 * `createCatTool` (ToolDefinition form). See `ls.ts` header.
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import { getDocumentByPath } from "@/lib/documents/documentRepository";

import type { RagToolContext } from "./types";

/** Soft cap on returned content size — keeps a long document from blowing up
 * the orchestrator's context window. Per CONTEXT.md D-14 (50 KiB). */
const MAX_CAT_BYTES = 50 * 1024;

const catArgsSchema = {
  path: z
    .string()
    .min(1)
    .startsWith("/", "Path must start with '/'")
    .describe("Absolute path of the document to read, e.g. '/policies/hr/remote-work.md'."),
};

const catArgsObjectSchema = z.object(catArgsSchema);

export interface CatArgs {
  path: string;
}

export interface CatResult {
  path: string;
  content: string;
  truncated: boolean;
}

export async function runCat(
  args: CatArgs,
  ctx: RagToolContext,
): Promise<CatResult> {
  const doc = await getDocumentByPath(ctx.companyId, args.path);
  if (!doc) {
    throw new Error(`cat: path not found: ${args.path}`);
  }
  const full = doc.original_content ?? "";
  const truncated = full.length > MAX_CAT_BYTES;
  return {
    path: args.path,
    content: truncated ? full.slice(0, MAX_CAT_BYTES) : full,
    truncated,
  };
}

export function createCatSdkTool(ctx: RagToolContext) {
  return tool(
    "cat",
    "Read the full content of a single document by absolute path. Use this after `search` to confirm the chunks' surrounding context.",
    catArgsSchema,
    async (args) => {
      try {
        const parsed = catArgsObjectSchema.parse(args);
        const out = await runCat(parsed, ctx);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(out) }],
          structuredContent: out as unknown as Record<string, unknown>,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `cat failed: ${msg}` }],
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

export function createCatTool(ctx: RagToolContext): ToolDefinition {
  return {
    name: "rag_cat",
    description:
      "Read the full content of a single document by absolute path within the company's corpus.",
    inputSchema: catArgsObjectSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path (must start with '/').",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
    execute: async (input) => runCat(catArgsObjectSchema.parse(input), ctx),
  };
}
