INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);

CREATE POLICY "Videos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Videos: authenticated insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Videos: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND auth.uid() = (
    SELECT usuario_id FROM public.presentes
    WHERE id = (storage.foldername(name))[1]
  ));
