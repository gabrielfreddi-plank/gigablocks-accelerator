/**
 * Tests for `runCat` — pure execution for `mcp__rag__cat`.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

type GetDocResult = { id: string; name: string; original_content: string } | null;
const getDocumentByPathMock = vi.fn<(c: string, p: string) => Promise<GetDocResult>>();

vi.mock("@/lib/documents/documentRepository", () => ({
  getDocumentByPath: (c: string, p: string) => getDocumentByPathMock(c, p),
}));

import { runCat } from "./cat";
import type { RagToolContext } from "./types";

const ctx: RagToolContext = {
  supabase: {} as RagToolContext["supabase"],
  companyId: "company-1",
};

beforeEach(() => {
  getDocumentByPathMock.mockReset();
});

describe("runCat", () => {
  it("returns the seeded content with truncated=false when small", async () => {
    getDocumentByPathMock.mockResolvedValueOnce({
      id: "doc-1",
      name: "foo",
      original_content: "Hello world",
    });
    const out = await runCat({ path: "/foo.md" }, ctx);
    expect(out).toEqual({
      path: "/foo.md",
      content: "Hello world",
      truncated: false,
    });
  });

  it("throws when the path is not found", async () => {
    getDocumentByPathMock.mockResolvedValueOnce(null);
    await expect(runCat({ path: "/missing.md" }, ctx)).rejects.toThrow(
      /cat:.*not found/,
    );
  });

  it("truncates content >50KB to exactly 50KB and sets truncated=true", async () => {
    const big = "x".repeat(60 * 1024);
    getDocumentByPathMock.mockResolvedValueOnce({
      id: "doc-1",
      name: "big",
      original_content: big,
    });
    const out = await runCat({ path: "/big.md" }, ctx);
    expect(out.truncated).toBe(true);
    expect(out.content.length).toBe(50 * 1024);
  });
});
