-- Auto-recovery for stuck generations.
-- Updated reset_stale_generations to handle all stuck records,
-- plus scheduled cron job (if pg_cron is available).

-- Drop old function if it exists
DROP FUNCTION IF EXISTS public.reset_stale_generations(INT);

CREATE OR REPLACE FUNCTION public.reset_stale_generations(
  max_age_minutes INT DEFAULT 10
)
RETURNS TABLE(action TEXT, presente_id UUID, attempts_before INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 1. Records that had attempts but are stuck (attempts >= 3 OR last_attempt_at IS NOT NULL)
  --    → reset attempts to 0 so Dashboard retry button can work
  RETURN QUERY
  UPDATE public.musicas m
  SET
    attempts       = 0,
    last_attempt_at = NULL,
    status         = 'generating'
  FROM public.presentes p
  WHERE p.id = m.presente_id
    AND p.status = 'generating'
    AND m.status = 'generating'
    AND (m.attempts >= 3 OR m.last_attempt_at IS NOT NULL)
    AND p.updated_at < now() - (max_age_minutes || ' minutes')::interval
  RETURNING 'reset'::TEXT, m.presente_id, m.attempts;

  -- 2. Records that were never actually attempted (attempts = 0, last_attempt_at IS NULL)
  --    → mark present as 'failed' so user sees retry button and can restart
  RETURN QUERY
  UPDATE public.presentes p
  SET
    status = 'failed',
    error_message = 'Geração estagnada. Clique em Tentar novamente.',
    updated_at = now()
  FROM public.musicas m
  WHERE m.presente_id = p.id
    AND p.status = 'generating'
    AND m.status = 'generating'
    AND m.attempts = 0
    AND m.last_attempt_at IS NULL
    AND p.updated_at < now() - (max_age_minutes || ' minutes')::interval
  RETURNING 'failed'::TEXT, p.id, 0::INT;
END;
$$;

-- Schedule automatic recovery every 5 minutes using pg_cron.
-- Requires pg_cron extension (enabled by default on Supabase).
-- To verify: SELECT * FROM cron.job WHERE jobname = 'recover-stuck-generations';
SELECT cron.schedule(
  'recover-stuck-generations',
  '*/5 * * * *',
  $$SELECT public.reset_stale_generations(10)$$
);

-- Ensure the SQL recovery script references work correctly
COMMENT ON FUNCTION public.reset_stale_generations IS
  'Resets or fails stuck generation records older than max_age_minutes.
   Case 1: attempts >= 3 → reset to 0 (user can retry from Dashboard).
   Case 2: attempts = 0, never attempted → set present to failed (user sees retry).';
