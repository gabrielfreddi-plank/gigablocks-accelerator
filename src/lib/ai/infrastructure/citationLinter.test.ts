/**
 * Tests for `lintCitations` — AI-SPEC §6 Guardrail #5.
 */

import { describe, it, expect } from "vitest";

import {
  lintCitations,
  type ActivityEvent,
  type CitationLintResult,
} from "./citationLinter";

function actWithChunkIds(...chunkIds: string[]): ActivityEvent {
  return {
    id: "1",
    ts: 0,
    agent: "rag",
    label: "search",
    output: { hits: chunkIds.map((c) => ({ chunkId: c, path: "/x.md" })) },
  };
}

describe("lintCitations", () => {
  it("1: happy path — ref resolves, chunkId surfaced, path in corpus", () => {
    const report = `Body claim. [1]

## Sources
[1] /research/foo.md (chunkId: abc-123)
`;
    const out = lintCitations(
      report,
      [actWithChunkIds("abc-123")],
      new Set(["/research/foo.md"]),
    );
    const expected: CitationLintResult = {
      ok: true,
      missing: [],
      unresolvedChunkIds: [],
      unknownPaths: [],
    };
    expect(out).toEqual(expected);
  });

  it("2: missing — [2] has no Sources entry", () => {
    const report = `Claim a [1]. Claim b [2].

## Sources
[1] /a.md (chunkId: c1)
`;
    const out = lintCitations(
      report,
      [actWithChunkIds("c1")],
      new Set(["/a.md"]),
    );
    expect(out.ok).toBe(false);
    expect(out.missing).toEqual([2]);
  });

  it("3: unresolvedChunkIds — Sources lists a chunkId no tool surfaced", () => {
    const report = `Claim [1].

## Sources
[1] /a.md (chunkId: ghost-id)
`;
    const out = lintCitations(
      report,
      [actWithChunkIds("real-id")],
      new Set(["/a.md"]),
    );
    expect(out.ok).toBe(false);
    expect(out.unresolvedChunkIds).toEqual(["ghost-id"]);
  });

  it("4: unknownPaths — Sources path not in the company's corpus", () => {
    const report = `Claim [1].

## Sources
[1] /research/leaked-from-elsewhere.md (chunkId: c1)
`;
    const out = lintCitations(
      report,
      [actWithChunkIds("c1")],
      new Set(["/something-else.md"]),
    );
    expect(out.ok).toBe(false);
    expect(out.unknownPaths).toEqual(["/research/leaked-from-elsewhere.md"]);
  });

  it("5: report with no [n] refs and no Sources is ok", () => {
    const report = `The corpus does not contain information about X.`;
    const out = lintCitations(report, [], new Set());
    expect(out.ok).toBe(true);
    expect(out.missing).toEqual([]);
  });

  it("6: [1] but no Sources section anywhere → missing=[1]", () => {
    const report = `Claim [1].`;
    const out = lintCitations(report, [], new Set());
    expect(out.ok).toBe(false);
    expect(out.missing).toEqual([1]);
  });

  it("7: Sources format tolerance — accepts `[1]`, `1.`, and `chunkId` is optional", () => {
    const report = `A [1] B [2] C [3].

## Sources
[1] /a.md (chunkId: c1)
2. /b.md
[3] /c.md
`;
    const out = lintCitations(
      report,
      [actWithChunkIds("c1")],
      new Set(["/a.md", "/b.md", "/c.md"]),
    );
    expect(out.ok).toBe(true);
    expect(out.missing).toEqual([]);
  });
});
