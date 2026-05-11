-- ============================================================
-- Migration: RAG corpus extensions
-- - Enable pgvector
-- - Add documents.path (with partial UNIQUE index for collision detection)
-- - Add document_chunks table with vector(512) embedding column + HNSW index
-- - RLS via is_company_member()
--
-- NOTE: The semantic-search RPC ships in a separate migration in Plan 2;
-- this migration carries only the schema scaffolding.
-- ============================================================

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ALTER: documents — add path column + partial UNIQUE index
-- ============================================================
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS path TEXT;

-- Partial UNIQUE index per RESEARCH.md pitfall #11 — allows pre-existing
-- rows with NULL path to coexist while still enforcing collisions on real
-- paths (company_id, path) within the same company.
CREATE UNIQUE INDEX IF NOT EXISTS documents_company_path_unique
  ON public.documents (company_id, path)
  WHERE path IS NOT NULL;

CREATE INDEX IF NOT EXISTS documents_path_idx
  ON public.documents (path);

-- ============================================================
-- TABLE: document_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id           BIGSERIAL PRIMARY KEY,
  document_id  UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  chunk_index  INT NOT NULL,
  path         TEXT NOT NULL,
  content      TEXT NOT NULL,
  embedding    vector(512) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B-tree indexes for typical filters
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
  ON public.document_chunks (document_id);
CREATE INDEX IF NOT EXISTS document_chunks_company_id_idx
  ON public.document_chunks (company_id);
CREATE INDEX IF NOT EXISTS document_chunks_path_idx
  ON public.document_chunks (path);

-- HNSW vector index — cosine distance (vector_cosine_ops). Voyage
-- voyage-3-lite locked to 512 dimensions per RESEARCH.md §Embedding
-- model recommendation. A future swap requires a follow-up migration.
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw
  ON public.document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- ROW LEVEL SECURITY (mirrors documents RLS — 002_migrate_to_english_schema.sql)
-- ============================================================
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_chunks: select for members"
  ON public.document_chunks FOR SELECT
  USING (public.is_company_member(document_chunks.company_id));

CREATE POLICY "document_chunks: insert for members"
  ON public.document_chunks FOR INSERT
  WITH CHECK (public.is_company_member(document_chunks.company_id));

CREATE POLICY "document_chunks: update for members"
  ON public.document_chunks FOR UPDATE
  USING (public.is_company_member(document_chunks.company_id));

CREATE POLICY "document_chunks: delete for members"
  ON public.document_chunks FOR DELETE
  USING (public.is_company_member(document_chunks.company_id));
