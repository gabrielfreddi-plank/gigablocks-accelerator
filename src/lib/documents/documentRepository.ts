import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Document repository — typed CRUD over the `documents` table.
 *
 * Exports:
 *  - `checkPathExists(companyId, path)` — pre-insert lookup.
 *  - `insertDocumentWithPath(input)` — parent-row insert with collision detection.
 *  - `DocumentPathConflictError`, `DocumentNotFoundError`, `isUniqueViolation` — error helpers.
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
    // The `path` column ships in migration 005; the generated types may lag
    // until Task 6 regenerates them, so cast through unknown for safety.
    .eq("company_id", companyId)
    .eq("path" as never, path as never)
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
 * Inserts a single documents row carrying the new `path` column.
 *
 * Plan 1 scope: parent row only — the chunk + embed pipeline ships in Plan 2
 * and replaces this function with a transactional `insertDocumentWithChunks`.
 *
 * Translates Postgres 23505 (unique violation) into the typed
 * DocumentPathConflictError so server actions can map it to the
 * UI-SPEC collision-error string.
 */
export async function insertDocumentWithPath(
  input: InsertDocumentWithPathInput,
): Promise<{ id: string }> {
  const supabase = await createClient();

  const insertPayload = {
    company_id: input.companyId,
    name: input.name,
    original_content: input.originalContent,
    path: input.path,
  } as unknown as Database["public"]["Tables"]["documents"]["Insert"];

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
