-- ============================================================
-- TABLE: memories
-- ============================================================
CREATE TABLE public.memories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT memories_user_title_unique UNIQUE (user_id, title)
);

CREATE TRIGGER set_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memories: select own"
  ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memories: insert own"
  ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories: update own"
  ON public.memories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memories: delete own"
  ON public.memories FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_memories_user_id ON public.memories (user_id);
