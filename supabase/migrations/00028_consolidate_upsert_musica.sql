-- Consolida overloads de upsert_musica (PGRST203) em uma única função.

DROP FUNCTION IF EXISTS public.upsert_musica(uuid, text, text, integer, timestamptz);
DROP FUNCTION IF EXISTS public.upsert_musica(uuid, text, text, integer, timestamptz, text, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_musica(
  p_presente_id UUID,
  p_status TEXT DEFAULT 'generating',
  p_estilo TEXT DEFAULT '',
  p_attempts INT DEFAULT 0,
  p_last_attempt_at TIMESTAMPTZ DEFAULT NULL,
  p_url_audio TEXT DEFAULT NULL,
  p_lyrics JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.musicas (presente_id, status, estilo, attempts, last_attempt_at, url_audio, lyrics)
  VALUES (
    p_presente_id,
    p_status,
    COALESCE(p_estilo, ''),
    COALESCE(p_attempts, 0),
    p_last_attempt_at,
    p_url_audio,
    p_lyrics
  )
  ON CONFLICT (presente_id) DO UPDATE SET
    status = EXCLUDED.status,
    estilo = CASE WHEN EXCLUDED.estilo <> '' THEN EXCLUDED.estilo ELSE public.musicas.estilo END,
    attempts = EXCLUDED.attempts,
    last_attempt_at = EXCLUDED.last_attempt_at,
    url_audio = COALESCE(EXCLUDED.url_audio, public.musicas.url_audio),
    lyrics = COALESCE(EXCLUDED.lyrics, public.musicas.lyrics);
END;
$$;
