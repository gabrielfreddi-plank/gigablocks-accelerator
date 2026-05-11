/**
 * `mcp__rag__search` — semantic + literal search across `document_chunks`.
 *
 * Modes:
 *  - `literal` — `ILIKE '%query%'` only (fast, exact-substring).
 *  - `semantic` — Voyage embedding + `match_chunks` RPC (cosine distance).
 *  - `auto` (default) — run both, merge by `chunkId`, keep the higher score,
 *    sort descending, top-5.
 *
 * Triple-export pattern. See `ls.ts` header.
 */

import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

import type { ToolDefinition } from "@/lib/ai/ports/toolRegistry";
import {
  literalSearchChunks,
  matchChunks,
} from "@/lib/documents/documentRepository";

import type { RagSearchToolContext } from "./types";

const searchArgsSchema = {
  query: z
    .string()
    .min(1)
    .max(500)
    .describe("Free-text query. Will be embedded and/or ILIKE-matched against chunk content."),
  scope: z
    .string()
    .optional()
    .describe(
      "Optional absolute path prefix to scope the search, e.g. '/policies/'. Omit to search the entire corpus.",
    ),
  mode: z
    .enum(["auto", "literal", "semantic"])
    .optional()
    .default("auto")
    .describe(
      "Search strategy: 'literal' (substring), 'semantic' (embedding), or 'auto' (both, merged).",
    ),
};

const searchArgsObjectSchema = z.object(searchArgsSchema);

export interface SearchArgs {
  query: string;
  scope?: string;
  mode: "auto" | "literal" | "semantic";
}

export interface SearchHit {
  path: string;
  snippet: string;
  score: number;
  chunkId: string;
  matchKind: "literal" | "semantic";
}

export interface SearchResult {
  hits: SearchHit[];
}

const MATCH_COUNT = 5;

export async function runSearch(
  args: SearchArgs,
  ctx: RagSearchToolContext,
): Promise<SearchResult> {
  const mode = args.mode;

  const literalHits: SearchHit[] = [];
  const semanticHits: SearchHit[] = [];

  if (mode !== "semantic") {
    const rows = await literalSearchChunks({
      companyId: ctx.companyId,
      query: args.query,
      pathPrefix: args.scope,
      matchCount: MATCH_COUNT,
    });
    for (const row of rows) {
      literalHits.push({
        path: row.path,
        snippet: row.snippet,
        score: 1.0,
        chunkId: String(row.chunk_id),
        matchKind: "literal",
      });
    }
  }

  if (mode !== "literal") {
    const embedding = await ctx.embed(args.query);
    const rows = await matchChunks({
      queryEmbedding: embedding,
      companyId: ctx.companyId,
      pathPrefix: args.scope,
      matchCount: MATCH_COUNT,
    });
    for (const row of rows) {
      semanticHits.push({
        path: row.path,
        snippet: row.snippet,
        score: row.similarity,
        chunkId: String(row.chunk_id),
        matchKind: "semantic",
      });
    }
  }

  if (mode === "literal") return { hits: literalHits.slice(0, MATCH_COUNT) };
  if (mode === "semantic") return { hits: semanticHits.slice(0, MATCH_COUNT) };

  // auto: merge by chunkId, keep higher score (semantic > literal at ties).
  const byId = new Map<string, SearchHit>();
  for (const hit of [...literalHits, ...semanticHits]) {
    const existing = byId.get(hit.chunkId);
    if (!existing || hit.score > existing.score) {
      byId.set(hit.chunkId, hit);
    }
  }
  const merged = Array.from(byId.values()).sort((a, b) => b.score - a.score);
  return { hits: merged.slice(0, MATCH_COUNT) };
}

export function createSearchSdkTool(ctx: RagSearchToolContext) {
  return tool(
    "search",
    "Search the company corpus for relevant document chunks using semantic + literal matching. Returns up to 5 hits with path, snippet, and chunkId. Use this before `cat` to narrow which documents to read.",
    searchArgsSchema,
    async (args) => {
      try {
        const parsed = searchArgsObjectSchema.parse(args);
        const out = await runSearch(parsed, ctx);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(out) }],
          structuredContent: out as unknown as Record<string, unknown>,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `search failed: ${msg}` }],
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

export function createSearchTool(ctx: RagSearchToolContext): ToolDefinition {
  return {
    name: "rag_search",
    description:
      "Search the company corpus for relevant document chunks (semantic + literal).",
    inputSchema: searchArgsObjectSchema,
    inputSchemaJson: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text query.",
        },
        scope: {
          type: "string",
          description: "Optional absolute path prefix.",
        },
        mode: {
          type: "string",
          description: "'auto' | 'literal' | 'semantic'. Defaults to 'auto'.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    execute: async (input) => runSearch(searchArgsObjectSchema.parse(input), ctx),
  };
}
