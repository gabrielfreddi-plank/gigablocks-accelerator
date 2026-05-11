import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Document repository — typed CRUD over the `documents` table and
 * `document_chunks` semantic-search RPC.
 *
 * Exports:
 *  - `checkPathExists(companyId, path)` — pre-insert lookup.
 *  - `insertDocumentWithPath(input)` — Plan 1 parent-only insert (deprecated;
 *    superseded by `insertDocumentWithChunks` from Plan 2).
 *  - `insertDocumentWithChunks(input)` — Plan 2 transactional insert with
 *    compensating-delete on chunks-insert failure (D-11).
 *  - `matchChunks(params)` — wraps the `match_chunks` Postgres RPC for
 *    semantic search (Plan 3 consumes this from the RAG specialist tools).
 *  - `DocumentPathConflictError`, `DocumentNotFoundError`, `isUniqueViolation`
 *    — error helpers.
 */

export type Document = Database["public"]["Tables"]["documents"]["Row"];

/**
 * Thrown when an INSERT or UPDATE collides on the partial unique index
 * (company_id, path) WHERE path IS NOT NULL (migration 005).
 *
 * The constructor accepts the conflicting path so callers can render the
 * UI-SPEC §"Add Document form" collision-error template verbatim.
 */
export class DocumentPathConflictError extends Error {
  public readonly path: string;

  constructor(path: string) {
    super(
      `A document already exists at "${path}" for this company. ` +
        "Change the path or delete the existing document.",
    );
    this.name = "DocumentPathConflictError";
    this.path = path;
  }
}

/**
 * Thrown when a single-row lookup (e.g. getDocumentByPath) finds nothing.
 * Mirrors MemoryNotFoundError.
 */
export class DocumentNotFoundError extends Error {
  constructor() {
    super("Document not found.");
    this.name = "DocumentNotFoundError";
  }
}

/**
 * Postgres unique-violation code helper — mirrors memoryRepository.ts.
 */
export function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

/**
 * Returns true if a document already exists at (companyId, path).
 * Used by the Add Document form's pre-insert client-side check.
 */
export async function checkPathExists(
  companyId: string,
  path: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("path", path)
    .maybeSingle();

  return !!data;
}

export interface InsertDocumentWithPathInput {
  companyId: string;
  name: string;
  originalContent: string;
  path: string;
}

/**
 * @deprecated Use {@link insertDocumentWithChunks} instead. Plan 1 surface
 * retained only for migration safety; the Plan 2 server action no longer
 * calls this.
 *
 * Inserts a single documents row carrying the new `path` column. Plan 1
 * scope: parent row only, no chunks. Translates Postgres 23505 (unique
 * violation) into the typed DocumentPathConflictError.
 */
export async function insertDocumentWithPath(
  input: InsertDocumentWithPathInput,
): Promise<{ id: string }> {
  const supabase = await createClient();

  const insertPayload: Database["public"]["Tables"]["documents"]["Insert"] = {
    company_id: input.companyId,
    name: input.name,
    original_content: input.originalContent,
    path: input.path,
  };

  const { data, error } = await supabase
    .from("documents")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new DocumentPathConflictError(input.path);
    }
    throw new Error(error.message);
  }

  if (!data) throw new DocumentNotFoundError();
  return { id: data.id };
}

export interface InsertDocumentChunkInput {
  index: number;
  content: string;
  embedding: number[];
}

export interface InsertDocumentWithChunksInput {
  companyId: string;
  name: string;
  originalContent: string;
  path: string;
  chunks: InsertDocumentChunkInput[];
}

/**
 * Insert the parent `documents` row + N `document_chunks` rows.
 *
 * D-11 ordering: parent insert → chunks insert. On chunks-insert failure,
 * compensating-delete the parent row so retry-on-same-path doesn't get
 * stuck on a partial-unique-index collision against an orphan row.
 *
 * The Supabase-JS client does NOT expose `BEGIN`/`COMMIT`, so this is a
 * best-effort two-step. If the compensating delete itself errors, we log
 * it and re-throw the ORIGINAL chunk-insert error so the user sees the
 * real cause; the next save attempt to the same path will then fail
 * loudly via the partial unique index — visible failure, not silent
 * corruption (threat T-02-05 accepted in 01-02-PLAN.md).
 */
export async function insertDocumentWithChunks(
  input: InsertDocumentWithChunksInput,
): Promise<{ id: string }> {
  const supabase = await createClient();

  // 1. Parent insert.
  const documentPayload: Database["public"]["Tables"]["documents"]["Insert"] = {
    company_id: input.companyId,
    name: input.name,
    original_content: input.originalContent,
    path: input.path,
  };

  const { data: parent, error: parentError } = await supabase
    .from("documents")
    .insert(documentPayload)
    .select("id")
    .single();

  if (parentError) {
    if (isUniqueViolation(parentError)) {
      throw new DocumentPathConflictError(input.path);
    }
    throw new Error(parentError.message);
  }
  if (!parent) throw new DocumentNotFoundError();

  const parentId = parent.id;

  // 2. Chunks insert (skip if no chunks — should never happen for non-empty
  // content but a defensive no-op is cheap).
  if (input.chunks.length === 0) {
    return { id: parentId };
  }

  const chunkRows: Database["public"]["Tables"]["document_chunks"]["Insert"][] =
    input.chunks.map((c) => ({
      document_id: parentId,
      company_id: input.companyId,
      chunk_index: c.index,
      path: input.path,
      content: c.content,
      // Postgres `vector(N)` accepts the literal `[v1, v2, ...]` string
      // representation. Casting via `as unknown as string` satisfies the
      // generated Insert type, which models the column as `string` because
      // pgvector serialises as text on the wire.
      embedding: `[${c.embedding.join(",")}]` as unknown as string,
    }));

  const { error: chunksError } = await supabase
    .from("document_chunks")
    .insert(chunkRows);

  if (chunksError) {
    // Compensating delete — best-effort.
    const { error: cleanupError } = await supabase
      .from("documents")
      .delete()
      .eq("id", parentId);
    if (cleanupError) {
      console.error(
        "[documentRepository] compensating delete failed after chunks-insert error",
        { parentId, cleanupError: cleanupError.message },
      );
    }
    throw new Error(`document_chunks insert failed: ${chunksError.message}`);
  }

  return { id: parentId };
}

export interface MatchChunksParams {
  queryEmbedding: number[];
  companyId: string;
  pathPrefix?: string;
  matchCount?: number;
}

export interface MatchedChunk {
  chunk_id: number;
  document_id: string;
  path: string;
  snippet: string;
  similarity: number;
}

/**
 * Semantic-search wrapper over the `match_chunks` RPC (migration 006).
 *
 * RLS enforcement: `match_chunks` is declared `SECURITY INVOKER`, so the
 * underlying `document_chunks` SELECT runs as the caller and
 * `is_company_member(company_id)` strips cross-company rows regardless of
 * what `companyId` is passed. Plan 4 adds a belt-and-braces runtime
 * assertion at the runner edge.
 *
 * Default `matchCount` is 5 per AI-SPEC §4 ("Context Window Strategy:
 * search should never return more than 5 hits per call").
 */
export async function matchChunks(
  params: MatchChunksParams,
): Promise<MatchedChunk[]> {
  const supabase = await createClient();

  // The generated `Database["public"]["Functions"]` map does NOT yet contain
  // `match_chunks` — that entry only appears after Task 4 regenerates types
  // post-migration. Cast the client through `unknown` so the `.rpc()` call
  // type-checks against a permissive signature for the brief Task 2 → Task 4
  // window. After Task 4 regen the cast becomes a no-op and can stay or be
  // dropped; leaving it in place avoids churn if the types diverge again.
  const supabaseRpc = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };

  const { data, error } = await supabaseRpc.rpc("match_chunks", {
    query_embedding: `[${params.queryEmbedding.join(",")}]`,
    match_count: params.matchCount ?? 5,
    filter_company: params.companyId,
    filter_path_prefix: params.pathPrefix ?? null,
  });

  if (error) {
    throw new Error(`match_chunks RPC failed: ${error.message}`);
  }

  return (data ?? []) as MatchedChunk[];
}

/* -----------------------------------------------------------------------------
 * Plan 01-03 read-side helpers — consumed by the RAG specialist's ls/cat/find
 * tools at `src/lib/ai/infrastructure/tools/rag/*`.
 *
 * Each helper is `companyId`-scoped at the SELECT so RLS via
 * `is_company_member(company_id)` is the security boundary; the closure-baked
 * `ctx.companyId` in each tool factory makes cross-company calls structurally
 * impossible at the client.
 * ---------------------------------------------------------------------------*/

/**
 * Return the de-duplicated list of paths under the given prefix for a single
 * company. Used by `mcp__rag__ls` (prefix = "/foo/") and by `mcp__rag__find`
 * (prefix = "/" for full-corpus glob filtering).
 */
export async function listPathsByCompany(
  companyId: string,
  prefix: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("path")
    .eq("company_id", companyId)
    .not("path", "is", null)
    .like("path", `${prefix}%`);

  if (error) {
    throw new Error(`listPathsByCompany failed: ${error.message}`);
  }

  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (row.path) seen.add(row.path);
  }
  return Array.from(seen);
}

/**
 * Look up a single document by company + path. Returns `null` if no row
 * matches (the SDK-form `cat` tool surfaces this as `isError: true`).
 */
export async function getDocumentByPath(
  companyId: string,
  path: string,
): Promise<{ id: string; name: string; original_content: string } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, original_content")
    .eq("company_id", companyId)
    .eq("path", path)
    .maybeSingle();

  if (error) {
    throw new Error(`getDocumentByPath failed: ${error.message}`);
  }
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    original_content: data.original_content ?? "",
  };
}

/**
 * Validate a set of chunk IDs belong to the given company. Used by the
 * cross-company runtime assertion (AI-SPEC §6 Guardrail #4) in
 * `claudeAgentSdkRunner.ts` PostToolUse — every `search.hits[].chunkId`
 * surfaced by a tool must resolve to a row in `document_chunks` with
 * `company_id = ?`. Returns the set of chunk IDs that DO belong to the
 * company; missing IDs imply a cross-company leak (or stale/invalid IDs).
 */
export async function validateChunkIds(
  companyId: string,
  chunkIds: number[],
): Promise<Set<number>> {
  if (chunkIds.length === 0) return new Set();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("document_chunks")
    .select("id")
    .eq("company_id", companyId)
    .in("id", chunkIds);

  if (error) {
    throw new Error(`validateChunkIds failed: ${error.message}`);
  }

  return new Set((data ?? []).map((r) => r.id));
}

export interface LiteralSearchParams {
  companyId: string;
  query: string;
  pathPrefix?: string;
  matchCount?: number;
}

export interface LiteralSearchHit {
  chunk_id: number;
  document_id: string;
  path: string;
  snippet: string;
}

/**
 * Literal `ILIKE '%query%'` search across `document_chunks.content` for a
 * single company. Used by the `mcp__rag__search` tool in the `literal` and
 * `auto` modes — the `semantic` branch goes through `matchChunks` above.
 *
 * Snippet truncation mirrors the `match_chunks` RPC: `LEFT(content, 400)`.
 */
export async function literalSearchChunks(
  params: LiteralSearchParams,
): Promise<LiteralSearchHit[]> {
  const supabase = await createClient();

  let qb = supabase
    .from("document_chunks")
    .select("id, document_id, path, content")
    .eq("company_id", params.companyId)
    .ilike("content", `%${params.query}%`);

  if (params.pathPrefix) {
    qb = qb.like("path", `${params.pathPrefix}%`);
  }

  const { data, error } = await qb
    .order("created_at", { ascending: false })
    .limit(params.matchCount ?? 5);

  if (error) {
    throw new Error(`literalSearchChunks failed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    chunk_id: row.id,
    document_id: row.document_id,
    path: row.path ?? "",
    snippet: (row.content ?? "").slice(0, 400),
  }));
}
