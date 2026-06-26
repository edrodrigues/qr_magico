-- Permite ao dono ler musicas durante generating/failed (stepper + retry por fase).

CREATE POLICY "Users can view musicas for own presentes"
  ON public.musicas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id
        AND presentes.usuario_id = auth.uid()
    )
  );
