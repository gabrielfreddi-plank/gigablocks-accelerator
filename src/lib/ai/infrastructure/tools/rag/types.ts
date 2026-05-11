/**
 * Shared types for the RAG tool surface.
 *
 * `RagToolContext` is closure-baked into every `createXxxSdkTool(ctx)` /
 * `createXxxTool(ctx)` factory in this directory so cross-company calls are
 * structurally impossible at the client (D-17 mechanical enforcement). Every
 * RAG tool factory receives the SAME shape; `search` additionally needs the
 * embedding function.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

export type SupabaseServerClient = SupabaseClient<Database>;

export interface RagToolContext {
  supabase: SupabaseServerClient;
  companyId: string;
}

export interface RagSearchToolContext extends RagToolContext {
  embed: (text: string) => Promise<number[]>;
}
