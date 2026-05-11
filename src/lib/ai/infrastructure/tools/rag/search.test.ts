/**
 * Tests for `runSearch` — pure execution for `mcp__rag__search`.
 *
 * The repository helpers `matchChunks` and `literalSearchChunks` are mocked;
 * `embed` is provided by the test ctx as a vitest mock function.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  LiteralSearchHit,
  MatchedChunk,
} from "@/lib/documents/documentRepository";

const matchChunksMock = vi.fn<(p: unknown) => Promise<MatchedChunk[]>>();
const literalSearchChunksMock = vi.fn<
  (p: unknown) => Promise<LiteralSearchHit[]>
>();

vi.mock("@/lib/documents/documentRepository", () => ({
  matchChunks: (p: unknown) => matchChunksMock(p),
  literalSearchChunks: (p: unknown) => literalSearchChunksMock(p),
}));

import { runSearch } from "./search";
import type { RagSearchToolContext } from "./types";

const embed = vi.fn().mockResolvedValue(new Array(512).fill(0));

const ctx: RagSearchToolContext = {
  supabase: {} as RagSearchToolContext["supabase"],
  companyId: "company-1",
  embed,
};

beforeEach(() => {
  matchChunksMock.mockReset();
  literalSearchChunksMock.mockReset();
  embed.mockClear();
});

describe("runSearch", () => {
  it("literal mode returns hits with matchKind='literal'", async () => {
    literalSearchChunksMock.mockResolvedValueOnce([
      {
        chunk_id: 7,
        document_id: "d1",
        path: "/research/q4.md",
        snippet: "Quarterly revenue rose...",
      },
    ]);
    const out = await runSearch(
      { query: "quarterly", mode: "literal" },
      ctx,
    );
    expect(out.hits).toHaveLength(1);
    expect(out.hits[0]!.matchKind).toBe("literal");
    expect(out.hits[0]!.path).toBe("/research/q4.md");
    expect(matchChunksMock).not.toHaveBeenCalled();
    expect(embed).not.toHaveBeenCalled();
  });

  it("semantic mode embeds the query once and maps RPC rows", async () => {
    matchChunksMock.mockResolvedValueOnce([
      {
        chunk_id: 11,
        document_id: "d1",
        path: "/research/q4.md",
        snippet: "snippet",
        similarity: 0.82,
      },
    ]);
    const out = await runSearch(
      { query: "revenue", mode: "semantic" },
      ctx,
    );
    expect(embed).toHaveBeenCalledTimes(1);
    expect(matchChunksMock).toHaveBeenCalledTimes(1);
    expect(out.hits).toHaveLength(1);
    expect(out.hits[0]!.matchKind).toBe("semantic");
    expect(out.hits[0]!.score).toBe(0.82);
  });

  it("auto mode merges by chunkId, dedupes, and sorts top-5 by score desc", async () => {
    // Same chunk_id 1 appears in both; semantic score should win.
    literalSearchChunksMock.mockResolvedValueOnce([
      {
        chunk_id: 1,
        document_id: "d1",
        path: "/a.md",
        snippet: "lit",
      },
      {
        chunk_id: 2,
        document_id: "d1",
        path: "/b.md",
        snippet: "lit b",
      },
    ]);
    matchChunksMock.mockResolvedValueOnce([
      {
        chunk_id: 1,
        document_id: "d1",
        path: "/a.md",
        snippet: "sem",
        similarity: 0.7, // less than literal's 1.0 — literal wins on the dedupe
      },
      {
        chunk_id: 3,
        document_id: "d1",
        path: "/c.md",
        snippet: "sem c",
        similarity: 0.5,
      },
    ]);
    const out = await runSearch({ query: "q", mode: "auto" }, ctx);
    const ids = out.hits.map((h) => h.chunkId);
    expect(new Set(ids).size).toBe(ids.length); // deduped
    expect(ids).toContain("1");
    expect(ids).toContain("2");
    expect(ids).toContain("3");
    // chunkId 1 is deduped: literal (score 1.0) wins over semantic (0.7).
    const one = out.hits.find((h) => h.chunkId === "1");
    expect(one!.matchKind).toBe("literal");
    // sorted by score descending
    const scores = out.hits.map((h) => h.score);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("forwards the scope path-prefix to both literal and semantic backends", async () => {
    literalSearchChunksMock.mockResolvedValueOnce([]);
    matchChunksMock.mockResolvedValueOnce([]);
    await runSearch(
      { query: "q", scope: "/research", mode: "auto" },
      ctx,
    );
    const litCall = literalSearchChunksMock.mock.calls[0]![0] as {
      pathPrefix?: string;
    };
    const semCall = matchChunksMock.mock.calls[0]![0] as {
      pathPrefix?: string;
    };
    expect(litCall.pathPrefix).toBe("/research");
    expect(semCall.pathPrefix).toBe("/research");
  });

  it("empty corpus returns { hits: [] }", async () => {
    literalSearchChunksMock.mockResolvedValueOnce([]);
    matchChunksMock.mockResolvedValueOnce([]);
    const out = await runSearch({ query: "q", mode: "auto" }, ctx);
    expect(out.hits).toEqual([]);
  });
});
