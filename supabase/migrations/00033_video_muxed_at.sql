ALTER TABLE public.presentes ADD COLUMN IF NOT EXISTS video_muxed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.presentes.video_muxed_at IS
  'Timestamp do último mux bem-sucedido (vídeo+áudio no S3)';
