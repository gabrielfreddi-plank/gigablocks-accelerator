"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import {
  DocumentPathConflictError,
  insertDocumentWithPath,
} from "@/lib/documents/documentRepository";

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

  try {
    await insertDocumentWithPath({
      companyId,
      name,
      originalContent,
      path: safePath,
    });
  } catch (err) {
    if (err instanceof DocumentPathConflictError) {
      return { error: err.message, success: false };
    }
    return {
      error: err instanceof Error ? err.message : "Failed to save document",
      success: false,
    };
  }

  // Plan 1 stub for the chunk + embed step (RESEARCH.md §"Plan 1 — Walking
  // Skeleton" item 7). Plan 2 replaces this console.log with the real
  // Voyage embedding + chunk-insert pipeline. We log only the path and
  // content length — never the content itself — per T-01-08.
  console.log("[plan-01] would chunk + embed document", {
    path: safePath,
    contentLen: originalContent.length,
  });

  // Optional policy-extraction toggle (D-10). The existing extractPolicies
  // server action keeps its own error envelope; Plan 01 deliberately does
  // not refactor it (CONTEXT.md `<deferred>`).
  if (extractPoliciesToggle) {
    try {
      const { extractPolicies } = await import("./extractPolicies");
      await extractPolicies(null, formData);
    } catch (err) {
      console.error("[plan-01] extractPolicies failed (non-blocking)", err);
    }
  }

  return { error: null, success: true };
}
