-- Fix 1: Storage bucket fotos INSERT policy — verifica ownership do presente
DROP POLICY IF EXISTS "Authenticated upload fotos" ON storage.objects;

CREATE POLICY "Usuário envia fotos dos próprios presentes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.presentes
      WHERE id::text = (storage.foldername(name))[1]
      AND usuario_id = auth.uid()
    )
  );

-- Fix 2: Adiciona política de UPDATE em fotos table (estava faltando)
CREATE POLICY "Users can update fotos for own presentes"
  ON public.fotos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.presentes
      WHERE presentes.id = fotos.presente_id AND presentes.usuario_id = auth.uid()
    )
  );
