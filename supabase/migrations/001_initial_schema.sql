-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: users (mirrors auth.users)
-- ============================================================
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE public.companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  user_id    UUID NOT NULL DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: company_members (join table — replaces scalar `members` field)
-- ============================================================
CREATE TABLE public.company_members (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id)
);

-- Auto-insert owner as member when company is created
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company();

-- ============================================================
-- TABLE: documents
-- ============================================================
CREATE TABLE public.documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  original_content TEXT,
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS helper: avoids self-referential policy loops on company_members
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = target_company_id
      AND cm.user_id = auth.uid()
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents       ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users: select own"
  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users: update own"
  ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- companies
CREATE POLICY "companies: select for members"
  ON public.companies FOR SELECT USING (public.is_company_member(companies.id));
CREATE POLICY "companies: insert by authenticated"
  ON public.companies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "companies: update by owner"
  ON public.companies FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "companies: delete by owner"
  ON public.companies FOR DELETE USING (user_id = auth.uid());

-- company_members
CREATE POLICY "company_members: select for members"
  ON public.company_members FOR SELECT USING (public.is_company_member(company_members.company_id));
CREATE POLICY "company_members: insert by owner"
  ON public.company_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid()));
CREATE POLICY "company_members: delete by owner"
  ON public.company_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND user_id = auth.uid()));

-- documents
CREATE POLICY "documents: select for members"
  ON public.documents FOR SELECT USING (public.is_company_member(documents.company_id));
CREATE POLICY "documents: insert for members"
  ON public.documents FOR INSERT WITH CHECK (public.is_company_member(documents.company_id));
CREATE POLICY "documents: update for members"
  ON public.documents FOR UPDATE USING (public.is_company_member(documents.company_id));
CREATE POLICY "documents: delete for members"
  ON public.documents FOR DELETE USING (public.is_company_member(documents.company_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_companies_user_id ON public.companies (user_id);
CREATE INDEX idx_company_members_user_company ON public.company_members (user_id, company_id);
CREATE INDEX idx_documents_company_id ON public.documents (company_id);
