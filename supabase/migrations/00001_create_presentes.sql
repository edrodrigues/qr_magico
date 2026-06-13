CREATE TABLE public.presentes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id        UUID NOT NULL REFERENCES auth.users(id),
  nome_homenageado  TEXT NOT NULL,
  ocasiao           TEXT NOT NULL,
  descricao_relacao TEXT DEFAULT '',
  estilo_musical    TEXT DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_payment', 'generating', 'ready', 'cancelled')),
  slug              TEXT NOT NULL UNIQUE,
  link              TEXT DEFAULT '',
  thumbnail_url     TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  expires_at        TIMESTAMPTZ
);

ALTER TABLE public.presentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own presentes"
  ON public.presentes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own presentes"
  ON public.presentes FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own presentes"
  ON public.presentes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete own presentes"
  ON public.presentes FOR DELETE
  USING (auth.uid() = usuario_id);
