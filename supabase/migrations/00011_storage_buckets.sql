INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('musicas', 'musicas', true);

CREATE POLICY "Public read fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos');

CREATE POLICY "Public read musicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'musicas');

CREATE POLICY "Authenticated upload fotos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Owner delete fotos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fotos' AND auth.uid()::text = owner_id
  );
