-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: usuarios (mirrors auth.users)
-- ============================================================
CREATE TABLE public.usuarios (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create usuarios row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: empresas
-- ============================================================
CREATE TABLE public.empresas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  usuario_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: empresa_membros (join table — replaces scalar `membros` field)
-- ============================================================
CREATE TABLE public.empresa_membros (
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (empresa_id, usuario_id)
);

-- Auto-insert owner as member when empresa is created
CREATE OR REPLACE FUNCTION public.handle_new_empresa()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.empresa_membros (empresa_id, usuario_id, role)
  VALUES (NEW.id, NEW.usuario_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_empresa_created
  AFTER INSERT ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_empresa();

-- ============================================================
-- TABLE: documentos
-- ============================================================
CREATE TABLE public.documentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              TEXT NOT NULL,
  conteudo_original TEXT,
  empresa_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS helper: avoids self-referential policy loops on empresa_membros
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_empresa_member(target_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.empresa_membros em
    WHERE em.empresa_id = target_empresa_id
      AND em.usuario_id = auth.uid()
  );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.usuarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos      ENABLE ROW LEVEL SECURITY;

-- usuarios
CREATE POLICY "usuarios: select own"
  ON public.usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "usuarios: update own"
  ON public.usuarios FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- empresas
CREATE POLICY "empresas: select for members"
  ON public.empresas FOR SELECT USING (public.is_empresa_member(empresas.id));
CREATE POLICY "empresas: insert by authenticated"
  ON public.empresas FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "empresas: update by owner"
  ON public.empresas FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "empresas: delete by owner"
  ON public.empresas FOR DELETE USING (usuario_id = auth.uid());

-- empresa_membros
CREATE POLICY "empresa_membros: select for members"
  ON public.empresa_membros FOR SELECT USING (public.is_empresa_member(empresa_membros.empresa_id));
CREATE POLICY "empresa_membros: insert by owner"
  ON public.empresa_membros FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.empresas WHERE id = empresa_id AND usuario_id = auth.uid()));
CREATE POLICY "empresa_membros: delete by owner"
  ON public.empresa_membros FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.empresas WHERE id = empresa_id AND usuario_id = auth.uid()));

-- documentos
CREATE POLICY "documentos: select for members"
  ON public.documentos FOR SELECT USING (public.is_empresa_member(documentos.empresa_id));
CREATE POLICY "documentos: insert for members"
  ON public.documentos FOR INSERT WITH CHECK (public.is_empresa_member(documentos.empresa_id));
CREATE POLICY "documentos: update for members"
  ON public.documentos FOR UPDATE USING (public.is_empresa_member(documentos.empresa_id));
CREATE POLICY "documentos: delete for members"
  ON public.documentos FOR DELETE USING (public.is_empresa_member(documentos.empresa_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_empresas_usuario_id ON public.empresas (usuario_id);
CREATE INDEX idx_empresa_membros_usuario_empresa ON public.empresa_membros (usuario_id, empresa_id);
CREATE INDEX idx_documentos_empresa_id ON public.documentos (empresa_id);
