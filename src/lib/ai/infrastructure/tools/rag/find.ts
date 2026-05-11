/**
 * `mcp__rag__find` — glob-match paths across the entire company corpus.
 *
 * Triple-export pattern. See `ls.ts` header.
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import { listPathsByCompany } from "@/lib/documents/documentRepository";

import type { RagToolContext } from "./types";

const findArgsSchema = {
  glob: z
    .string()
    .min(1)
    .describe(
      "Glob pattern, e.g. '/policies/**/*.md' or '/research/**'. Supports '*' (single segment) and '**' (any depth).",
    ),
};

const findArgsObjectSchema = z.object(findArgsSchema);

export interface FindArgs {
  glob: string;
}

export interface FindResult {
  paths: string[];
}

/**
 * Convert a glob to an anchored regex.
 *   '**' → '.*'
 *   '*'  → '[^/]*'
 *   other characters → escaped literal.
 */
function globToRegex(glob: string): RegExp {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      re += ".*";
      i++; // consume second '*'
    } else if (c === "*") {
      re += "[^/]*";
    } else if (c === "?") {
      re += "[^/]";
    } else if (c && /[.+^${}()|[\]\\]/.test(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  re += "$";
  return new RegExp(re);
}

export async function runFind(
  args: FindArgs,
  ctx: RagToolContext,
): Promise<FindResult> {
  const paths = await listPathsByCompany(ctx.companyId, "/");
  const re = globToRegex(args.glob);
  return {
    paths: paths.filter((p) => re.test(p)).sort(),
  };
}

export function createFindSdkTool(ctx: RagToolContext) {
  return tool(
    "find",
    "Glob-match document paths across the company corpus. Use '*' for single segments and '**' for any depth, e.g. '/policies/**/*.md'.",
    findArgsSchema,
    async (args) => {
      try {
        const parsed = findArgsObjectSchema.parse(args);
        const out = await runFind(parsed, ctx);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(out) }],
          structuredContent: out as unknown as Record<string, unknown>,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `find failed: ${msg}` }],
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

export function createFindTool(ctx: RagToolContext): ToolDefinition {
  return {
    name: "rag_find",
    description: "Glob-match document paths across the company corpus.",
    inputSchema: findArgsObjectSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        glob: {
          type: "string",
          description: "Glob pattern with '*' / '**' wildcards.",
        },
      },
      required: ["glob"],
      additionalProperties: false,
    },
    execute: async (input) => runFind(findArgsObjectSchema.parse(input), ctx),
  };
}
