ALTER TABLE public.fotos
  ADD COLUMN type TEXT NOT NULL DEFAULT 'image'
  CHECK (type IN ('image', 'video'));
