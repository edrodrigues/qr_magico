DROP POLICY IF EXISTS "Users can update musicas for own presentes" ON public.musicas;

CREATE POLICY "Users can update musicas for own presentes"
  ON public.musicas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id AND presentes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id AND presentes.usuario_id = auth.uid()
    )
  );
