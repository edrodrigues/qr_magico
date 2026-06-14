ALTER TABLE public.musicas
  ADD COLUMN attempts       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_attempt_at TIMESTAMPTZ;
