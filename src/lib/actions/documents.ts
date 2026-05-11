"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import {
  DocumentPathConflictError,
  insertDocumentWithChunks,
} from "@/lib/documents/documentRepository";
import { chunkText } from "@/lib/ai/infrastructure/embedding/chunkText";
import { embedBatch } from "@/lib/ai/infrastructure/embedding/voyageEmbedding";

export interface AddDocumentState {
  error: string | null;
  success: boolean;
}

export async function checkDocumentExists(
  companyId: string,
  title: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", title.trim())
    .maybeSingle();
  return !!data;
}

/**
 * Server-side path validation (defense-in-depth per CONTEXT.md D-12).
 *
 * Returns an error string matching the UI-SPEC §"Add Document form"
 * copy verbatim, or null if the path is acceptable.
 */
function validatePath(path: string | null): string | null {
  if (!path) {
    return "Document path is required";
  }
  if (!path.startsWith("/")) {
    return 'Path must start with "/"';
  }
  // `..` segment check (split on / so we don't reject paths that merely
  // contain the two dots in a filename like `foo..bar`).
  const segments = path.split("/");
  if (segments.some((segment) => segment === "..")) {
    return 'Path cannot contain ".." segments';
  }
  if (!/^[A-Za-z0-9._\-/]+$/.test(path)) {
    return 'Path can only contain letters, numbers, "-", "_", ".", and "/"';
  }
  // Segment count uses the same `filter(Boolean)` rule the client uses so
  // leading-slash empty segments don't count against the 8-segment cap.
  const segmentCount = segments.filter(Boolean).length;
  if (path.length > 256 || segmentCount > 8) {
    return "Path is too long (max 256 characters, 8 segments)";
  }
  return null;
}

export async function addDocument(
  _: unknown,
  formData: FormData,
): Promise<AddDocumentState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const name = formData.get("title") as string;
  const originalContent = formData.get("content") as string;
  const companyId = formData.get("companyId") as string;
  const rawPath = formData.get("path");
  const path =
    typeof rawPath === "string" && rawPath.trim().length > 0
      ? rawPath.trim()
      : null;
  const extractPoliciesToggle = formData.get("extractPolicies") === "true";

  if (!name?.trim())
    return { error: "Document title is required", success: false };
  if (!originalContent?.trim())
    return { error: "Document content is required", success: false };
  if (!companyId)
    return { error: "Company ID is required", success: false };

  const pathError = validatePath(path);
  if (pathError) {
    return { error: pathError, success: false };
  }

  // path is guaranteed non-null after validatePath().
  const safePath = path as string;

  // 1. Chunk in memory (pure function — no I/O, no errors except OOM).
  const chunks = chunkText(originalContent);
  if (chunks.length === 0) {
    return {
      error:
        "Document content produced no chunks. Add at least one paragraph of text.",
      success: false,
    };
  }

  // 2. Embed all chunks in one Voyage batch call. Wrap in try/catch so a
  // Voyage failure surfaces as the UI-SPEC `Indexing failed: …` string
  // and does NOT write a parent documents row (we haven't called
  // insertDocumentWithChunks yet — the embed happens BEFORE the parent
  // insert, per D-11).
  let embeddings: number[][];
  try {
    embeddings = await embedBatch(chunks);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `Indexing failed: ${message}. The document was not saved.`,
      success: false,
    };
  }

  // Defensive: Voyage MUST return one embedding per input. If it returns
  // a different count we can't safely map chunks → embeddings; abort.
  if (embeddings.length !== chunks.length) {
    return {
      error: `Indexing failed: Voyage returned ${embeddings.length} embeddings for ${chunks.length} chunks. The document was not saved.`,
      success: false,
    };
  }

  const chunkInputs = chunks.map((content, index) => ({
    index,
    content,
    embedding: embeddings[index]!,
  }));

  // 3. Transactional parent + chunks insert with compensating delete on
  // chunks-insert failure (per documentRepository).
  try {
    await insertDocumentWithChunks({
      companyId,
      name,
      originalContent,
      path: safePath,
      chunks: chunkInputs,
    });
  } catch (err) {
    if (err instanceof DocumentPathConflictError) {
      return { error: err.message, success: false };
    }
    const message = err instanceof Error ? err.message : "Failed to save document";
    return {
      error: `Indexing failed: ${message}. The document was not saved.`,
      success: false,
    };
  }

  // 4. Optional policy-extraction toggle (D-10). The existing extractPolicies
  // server action keeps its own error envelope; Plan 01 deliberately does
  // not refactor it (CONTEXT.md `<deferred>`). Non-blocking — if it fails
  // the save still succeeds.
  if (extractPoliciesToggle) {
    try {
      const { extractPolicies } = await import("./extractPolicies");
      await extractPolicies(null, formData);
    } catch (err) {
      console.error("[plan-02] extractPolicies failed (non-blocking)", err);
    }
  }

  return { error: null, success: true };
}
