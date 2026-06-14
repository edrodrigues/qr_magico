CREATE TABLE public.fotos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presente_id  UUID NOT NULL REFERENCES public.presentes(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  ordem        INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fotos of ready presentes"
  ON public.fotos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = fotos.presente_id AND presentes.status = 'ready'
    )
  );

CREATE POLICY "Users can insert fotos for own presentes"
  ON public.fotos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = fotos.presente_id AND presentes.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fotos for own presentes"
  ON public.fotos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = fotos.presente_id AND presentes.usuario_id = auth.uid()
    )
  );
