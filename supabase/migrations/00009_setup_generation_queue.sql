-- Retry/reset utility for stuck music generation.
-- Run manually from the SQL Editor when needed, or create a cron job
-- (pg_cron + pg_net) if you want automatic retries.

-- Reset attempts on stale generating records so the next Edge Function
-- invocation gets a fresh retry budget.
CREATE OR REPLACE FUNCTION public.reset_stale_generations(
  max_age_minutes INT DEFAULT 10
)
RETURNS TABLE(presente_id uuid, attempts_before INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
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
    AND m.attempts >= 3
    AND (m.last_attempt_at IS NULL OR m.last_attempt_at < now() - (max_age_minutes || ' minutes')::interval)
  RETURNING m.presente_id, m.attempts;
END;
$$;
