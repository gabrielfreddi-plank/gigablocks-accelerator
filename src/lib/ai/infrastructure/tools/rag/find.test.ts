/**
 * Tests for `runFind` — pure execution for `mcp__rag__find`.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const listPathsByCompanyMock = vi.fn<(c: string, p: string) => Promise<string[]>>();

vi.mock("@/lib/documents/documentRepository", () => ({
  listPathsByCompany: (c: string, p: string) =>
    listPathsByCompanyMock(c, p),
}));

import { runFind } from "./find";
import type { RagToolContext } from "./types";

const ctx: RagToolContext = {
  supabase: {} as RagToolContext["supabase"],
  companyId: "company-1",
};

beforeEach(() => {
  listPathsByCompanyMock.mockReset();
  listPathsByCompanyMock.mockResolvedValue([
    "/research/q4-strategy.md",
    "/research/team/headcount.md",
    "/policies/hr/parental-leave.md",
    "/policies/onboarding.md",
  ]);
});

describe("runFind", () => {
  it("'/research/**' matches all paths under /research and excludes /policies", async () => {
    const out = await runFind({ glob: "/research/**" }, ctx);
    expect(out.paths).toContain("/research/q4-strategy.md");
    expect(out.paths).toContain("/research/team/headcount.md");
    expect(out.paths).not.toContain("/policies/hr/parental-leave.md");
    expect(out.paths).not.toContain("/policies/onboarding.md");
  });

  it("'/policies/*' matches only first-level entries under /policies", async () => {
    const out = await runFind({ glob: "/policies/*" }, ctx);
    expect(out.paths).toContain("/policies/onboarding.md");
    expect(out.paths).not.toContain("/policies/hr/parental-leave.md");
  });

  it("returns empty when nothing matches", async () => {
    const out = await runFind({ glob: "/nonexistent/**" }, ctx);
    expect(out.paths).toEqual([]);
  });
});
