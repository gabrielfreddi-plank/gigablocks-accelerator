-- ============================================================
-- Migration: match_chunks RPC — semantic search over document_chunks
--
-- This function is declared as a caller-rights routine (see the
-- security clause on the function body below). The intent is that
-- the underlying SELECT runs as the caller and the RLS policies on
-- `document_chunks` (specifically the `is_company_member()` SELECT
-- policy) strip cross-company rows before they ever leave the database.
--
-- Changing the security clause to owner-rights mode would bypass RLS
-- and leak every company's chunks to every authenticated user. This is
-- a HIGH-severity regression risk (AI-SPEC §6 Guardrail #3, threat
-- T-02-03 in 01-02-PLAN.md threat register). The grep gate in the plan
-- enforces caller-rights mode.
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding    vector(512),
  match_count        int  DEFAULT 5,
  filter_company     uuid DEFAULT NULL,
  filter_path_prefix text DEFAULT NULL
)
RETURNS TABLE (
  chunk_id    bigint,
  document_id uuid,
  path        text,
  snippet     text,
  similarity  float
)
LANGUAGE sql STABLE
SECURITY INVOKER
AS $$
  SELECT
    id            AS chunk_id,
    document_id,
    path,
    LEFT(content, 400) AS snippet,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.document_chunks
  WHERE (filter_company IS NULL OR company_id = filter_company)
    AND (filter_path_prefix IS NULL OR path LIKE (filter_path_prefix || '%'))
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
