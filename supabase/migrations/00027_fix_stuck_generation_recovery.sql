-- Recovery corrigido + upsert_musica + generation_started_at

ALTER TABLE public.presentes
  ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.upsert_musica(
  p_presente_id UUID,
  p_status TEXT DEFAULT 'generating',
  p_estilo TEXT DEFAULT '',
  p_attempts INT DEFAULT 0,
  p_last_attempt_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.musicas (presente_id, status, estilo, attempts, last_attempt_at)
  VALUES (p_presente_id, p_status, COALESCE(p_estilo, ''), COALESCE(p_attempts, 0), p_last_attempt_at)
  ON CONFLICT (presente_id) DO UPDATE SET
    status = EXCLUDED.status,
    estilo = CASE WHEN EXCLUDED.estilo <> '' THEN EXCLUDED.estilo ELSE public.musicas.estilo END,
    attempts = EXCLUDED.attempts,
    last_attempt_at = EXCLUDED.last_attempt_at;
END;
$$;

DROP FUNCTION IF EXISTS public.reset_stale_generations(INT);

CREATE OR REPLACE FUNCTION public.reset_stale_generations(
  max_age_minutes INT DEFAULT 15
)
RETURNS TABLE(action TEXT, presente_id UUID, attempts_before INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- A: música travada em generating há muito tempo
  RETURN QUERY
  UPDATE public.presentes p
  SET
    status = 'failed',
    error_message = 'Geração da música estagnou. Clique em Tentar novamente.',
    updated_at = now()
  FROM public.musicas m
  WHERE m.presente_id = p.id
    AND p.status = 'generating'
    AND m.status = 'generating'
    AND m.last_attempt_at IS NOT NULL
    AND m.last_attempt_at < now() - (max_age_minutes || ' minutes')::interval
  RETURNING 'music_stuck'::TEXT, p.id, m.attempts;

  -- B: vídeo iniciado mas não concluído
  RETURN QUERY
  UPDATE public.presentes p
  SET
    status = 'failed',
    error_message = 'Renderização do vídeo não concluiu. Clique em Tentar novamente.',
    updated_at = now()
  WHERE p.status = 'generating'
    AND p.render_request_id IS NOT NULL
    AND (p.video_url IS NULL OR p.video_url = '')
    AND COALESCE(p.generation_started_at, p.created_at) < now() - ((max_age_minutes + 5) || ' minutes')::interval
  RETURNING 'video_stuck'::TEXT, p.id, 0::INT;

  -- C: música pronta mas vídeo nunca iniciou
  RETURN QUERY
  UPDATE public.presentes p
  SET
    status = 'failed',
    error_message = 'Vídeo não foi iniciado. Clique em Tentar novamente.',
    updated_at = now()
  FROM public.musicas m
  WHERE m.presente_id = p.id
    AND p.status = 'generating'
    AND m.status = 'ready'
    AND m.url_audio IS NOT NULL
    AND p.render_request_id IS NULL
    AND COALESCE(m.last_attempt_at, p.created_at) < now() - (max_age_minutes || ' minutes')::interval
  RETURNING 'video_not_started'::TEXT, p.id, m.attempts;

  -- D: estado inconsistente — render iniciado sem música pronta
  RETURN QUERY
  UPDATE public.presentes p
  SET
    status = 'failed',
    error_message = 'Estado inconsistente na geração. Clique em Tentar novamente.',
    render_request_id = NULL,
    updated_at = now()
  FROM public.musicas m
  WHERE m.presente_id = p.id
    AND p.status = 'generating'
    AND p.render_request_id IS NOT NULL
    AND (m.status <> 'ready' OR m.url_audio IS NULL)
  RETURNING 'inconsistent'::TEXT, p.id, m.attempts;

  -- E: sem linha em musicas
  RETURN QUERY
  UPDATE public.presentes p
  SET
    status = 'failed',
    error_message = 'Geração não foi iniciada. Clique em Tentar novamente.',
    updated_at = now()
  WHERE p.status = 'generating'
    AND NOT EXISTS (SELECT 1 FROM public.musicas m WHERE m.presente_id = p.id)
    AND p.created_at < now() - (max_age_minutes || ' minutes')::interval
  RETURNING 'no_musicas'::TEXT, p.id, 0::INT;
END;
$$;

COMMENT ON FUNCTION public.reset_stale_generations IS
  'Marca como failed presentes presos em generating. Usa last_attempt_at e generation_started_at, não updated_at.';
