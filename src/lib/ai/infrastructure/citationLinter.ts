/**
 * Citation linter — AI-SPEC §6 Guardrail #5.
 *
 * Pure, deterministic check: parse a report's `[n]` refs + `## Sources`
 * section, walk the tool-call activity log, and flag (a) `[n]` references
 * with no Sources entry, (b) Sources entries whose `chunkId` was never
 * surfaced by any tool call, (c) Sources entries whose `path` is not in the
 * requester's company corpus.
 *
 * Phase 1 disposition is "Flag" — the adapter appends a warning block to
 * the streamed report on non-ok result and continues. Phase 2 may promote
 * to "Block".
 */

export type ActivityEvent = {
  id: string;
  ts: number;
  agent: string;
  label: string;
  icon?: string;
  status?: "running" | "ok" | "error";
  durationMs?: number;
  input?: unknown;
  output?: unknown;
};

export interface CitationLintResult {
  ok: boolean;
  /** `[n]` references in the report whose `n` has no Sources entry. */
  missing: number[];
  /** Sources entries whose `chunkId` was NOT surfaced by any tool call. */
  unresolvedChunkIds: string[];
  /** Sources entries whose `path` is NOT in the company's documents.path set. */
  unknownPaths: string[];
}

interface ParsedSourcesEntry {
  num: number;
  path?: string;
  chunkId?: string;
}

/* -----------------------------------------------------------------------------
 * Parsing helpers
 * ---------------------------------------------------------------------------*/

/** Extract de-duplicated `[n]` reference numbers in document order. */
function extractRefs(report: string): number[] {
  const matches = [...report.matchAll(/\[(\d+)\]/g)].map((m) =>
    parseInt(m[1]!, 10),
  );
  return Array.from(new Set(matches));
}

/** Locate the line range of a "## Sources" (or any-level "Sources") section.
 * Liberal: matches `#`/`##`/`###` "Sources" case-insensitively. */
function extractSourcesBlock(report: string): string[] {
  const lines = report.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,3}\s+sources\s*$/i.test(lines[i]!.trim())) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return [];
  // Continue until the next top-level heading or EOF.
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!;
    if (/^#{1,3}\s+\S+/.test(line.trim())) break;
    if (line.trim().length === 0) continue;
    out.push(line);
  }
  return out;
}

/** Parse a single Sources line. Accepts:
 *   `[1] /path/foo.md (chunkId: abc-123)`
 *   `[1] /path/foo.md`
 *   `[1] -> /path/foo.md`
 *   `1. /path/foo.md`
 *   `- [1] /path/foo.md`
 */
function parseSourcesLine(line: string): ParsedSourcesEntry | null {
  const trimmed = line.trim().replace(/^[-*]\s+/, "");
  // Number is `[1]` or `1.` (optionally followed by `->` or `-`).
  const numMatch = trimmed.match(/^\[?(\d+)\]?[.:]?\s*(?:->|—|-)?\s*(.*)$/);
  if (!numMatch) return null;
  const num = parseInt(numMatch[1]!, 10);
  if (Number.isNaN(num)) return null;
  const rest = numMatch[2] ?? "";

  // Path: first absolute-path-looking substring starting with '/'.
  const pathMatch = rest.match(/(\/[A-Za-z0-9._\-/]+)/);
  const path = pathMatch ? pathMatch[1] : undefined;

  // chunkId: explicit `chunkId: xxx` substring.
  const chunkMatch = rest.match(/chunk[Ii]d\s*[:=]\s*([A-Za-z0-9_-]+)/);
  const chunkId = chunkMatch ? chunkMatch[1] : undefined;

  return { num, path, chunkId };
}

/** Collect every chunkId surfaced by any tool output on the activity log.
 * Searches `search.hits[].chunkId` first; falls back to a recursive walk so
 * any future tool with a `chunkId` field is also picked up. */
function collectSurfacedChunkIds(activityLog: ActivityEvent[]): Set<string> {
  const surfaced = new Set<string>();
  const visit = (val: unknown): void => {
    if (!val || typeof val !== "object") return;
    if (Array.isArray(val)) {
      for (const item of val) visit(item);
      return;
    }
    const obj = val as Record<string, unknown>;
    const cid = obj.chunkId;
    if (typeof cid === "string") surfaced.add(cid);
    if (typeof cid === "number") surfaced.add(String(cid));
    for (const k of Object.keys(obj)) {
      visit(obj[k]);
    }
  };
  for (const ev of activityLog) {
    visit(ev.output);
  }
  return surfaced;
}

/* -----------------------------------------------------------------------------
 * Public API
 * ---------------------------------------------------------------------------*/

export function lintCitations(
  report: string,
  activityLog: ActivityEvent[],
  companyPaths: Set<string>,
): CitationLintResult {
  // Inline refs.
  const refs = extractRefs(report);

  // Parse Sources block, indexed by num.
  const sourcesLines = extractSourcesBlock(report);
  const sourcesByNum = new Map<number, ParsedSourcesEntry>();
  for (const line of sourcesLines) {
    const parsed = parseSourcesLine(line);
    if (parsed) sourcesByNum.set(parsed.num, parsed);
  }

  // Surfaced chunkIds from tool outputs.
  const surfacedChunkIds = collectSurfacedChunkIds(activityLog);

  // Compute flags.
  const missing = refs.filter((n) => !sourcesByNum.has(n));

  const unresolvedChunkIds: string[] = [];
  const unknownPaths: string[] = [];
  for (const entry of sourcesByNum.values()) {
    if (entry.chunkId && !surfacedChunkIds.has(entry.chunkId)) {
      unresolvedChunkIds.push(entry.chunkId);
    }
    if (entry.path && !companyPaths.has(entry.path)) {
      unknownPaths.push(entry.path);
    }
  }

  const ok =
    missing.length === 0 &&
    unresolvedChunkIds.length === 0 &&
    unknownPaths.length === 0;

  return { ok, missing, unresolvedChunkIds, unknownPaths };
}
