-- Fix musicas RLS policies: ensure INSERT and UPDATE are properly defined
-- with both USING and WITH CHECK clauses

-- Recreate INSERT policy on musicas
DROP POLICY IF EXISTS "Users can insert musicas for own presentes" ON public.musicas;
CREATE POLICY "Users can insert musicas for own presentes"
  ON public.musicas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id
        AND presentes.usuario_id = auth.uid()
    )
  );

-- Recreate UPDATE policy on musicas
DROP POLICY IF EXISTS "Users can update musicas for own presentes" ON public.musicas;
CREATE POLICY "Users can update musicas for own presentes"
  ON public.musicas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id
        AND presentes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = musicas.presente_id
        AND presentes.usuario_id = auth.uid()
    )
  );

-- Fix presentes UPDATE policy: add explicit WITH CHECK
DROP POLICY IF EXISTS "Users can update own presentes" ON public.presentes;
CREATE POLICY "Users can update own presentes"
  ON public.presentes FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);
