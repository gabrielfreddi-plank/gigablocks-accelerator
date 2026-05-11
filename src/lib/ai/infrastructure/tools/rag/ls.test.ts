/**
 * Tests for `runLs` — the pure execution function for the `mcp__rag__ls`
 * tool. The repository call `listPathsByCompany` is mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const listPathsByCompanyMock = vi.fn<(companyId: string, prefix: string) => Promise<string[]>>();

vi.mock("@/lib/documents/documentRepository", () => ({
  listPathsByCompany: (companyId: string, prefix: string) =>
    listPathsByCompanyMock(companyId, prefix),
}));

// Import after mock registration.
import { runLs } from "./ls";
import type { RagToolContext } from "./types";

const ctx: RagToolContext = {
  // The mocked module never reads the client; cast a stub.
  supabase: {} as RagToolContext["supabase"],
  companyId: "company-1",
};

beforeEach(() => {
  listPathsByCompanyMock.mockReset();
});

describe("runLs", () => {
  it("returns mixed file + dir entries under a non-root prefix", async () => {
    listPathsByCompanyMock.mockResolvedValueOnce([
      "/research/q4-strategy.md",
      "/research/team/headcount.md",
      "/policies/hr/parental-leave.md",
    ]);

    const out = await runLs({ prefix: "/research/" }, ctx);
    const paths = out.entries.map((e) => e.path).sort();
    expect(paths).toEqual(
      ["/research/q4-strategy.md", "/research/team/"].sort(),
    );

    const teamEntry = out.entries.find((e) => e.path === "/research/team/");
    expect(teamEntry?.kind).toBe("dir");
    const fileEntry = out.entries.find(
      (e) => e.path === "/research/q4-strategy.md",
    );
    expect(fileEntry?.kind).toBe("file");
  });

  it("returns a synthetic dir for nested-only path prefixes", async () => {
    listPathsByCompanyMock.mockResolvedValueOnce([
      "/policies/hr/parental-leave.md",
    ]);
    const out = await runLs({ prefix: "/policies/" }, ctx);
    expect(out.entries).toEqual([{ path: "/policies/hr/", kind: "dir" }]);
  });

  it("returns empty entries for a non-matching prefix", async () => {
    listPathsByCompanyMock.mockResolvedValueOnce([
      "/research/q4-strategy.md",
    ]);
    const out = await runLs({ prefix: "/nonexistent/" }, ctx);
    expect(out.entries).toEqual([]);
  });

  it("at root '/', returns synthetic top-level directories", async () => {
    listPathsByCompanyMock.mockResolvedValueOnce([
      "/research/q4-strategy.md",
      "/policies/hr/parental-leave.md",
    ]);
    const out = await runLs({ prefix: "/" }, ctx);
    const paths = out.entries.map((e) => e.path).sort();
    expect(paths).toEqual(["/policies/", "/research/"]);
    for (const e of out.entries) {
      expect(e.kind).toBe("dir");
    }
  });

  it("normalises path: dirs end in '/', files do not", async () => {
    listPathsByCompanyMock.mockResolvedValueOnce([
      "/a/b.md",
      "/a/c/d.md",
    ]);
    const out = await runLs({ prefix: "/a/" }, ctx);
    for (const e of out.entries) {
      if (e.kind === "dir") expect(e.path.endsWith("/")).toBe(true);
      if (e.kind === "file") expect(e.path.endsWith("/")).toBe(false);
    }
  });
});
