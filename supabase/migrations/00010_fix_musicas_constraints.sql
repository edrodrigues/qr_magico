ALTER TABLE public.musicas
  ADD CONSTRAINT musicas_presente_id_key UNIQUE (presente_id);

CREATE POLICY "Users can delete musicas for own presentes"
  ON public.musicas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id AND presentes.usuario_id = auth.uid()
    )
  );

ALTER TABLE public.presentes
  DROP CONSTRAINT IF EXISTS presentes_status_check,
  ADD CONSTRAINT presentes_status_check
    CHECK (status IN ('draft', 'pending_payment', 'generating', 'ready', 'cancelled', 'failed'));
