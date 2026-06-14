CREATE TABLE public.musicas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id  UUID NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
  url_audio    TEXT,
  estilo       TEXT NOT NULL DEFAULT '',
  lyrics       JSONB DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'ready', 'failed')),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.musicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view musicas of ready presentes"
  ON public.musicas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id AND presentes.status = 'ready'
    )
  );

CREATE POLICY "Users can insert musicas for own presentes"
  ON public.musicas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id AND presentes.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update musicas for own presentes"
  ON public.musicas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id AND presentes.usuario_id = auth.uid()
    )
  );
