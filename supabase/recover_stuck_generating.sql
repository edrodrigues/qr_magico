-- ============================================================
-- Recovery queries for stuck "Em Processamento" (generating) gifts
-- Run these in the Supabase SQL Editor when a gift is stuck.
-- ============================================================

-- 1. IDENTIFY stuck records (generating for >30 minutes)
SELECT p.id, p.slug, p.nome_homenageado, p.updated_at, m.attempts, m.status AS musica_status
FROM public.presentes p
LEFT JOIN public.musicas m ON m.presente_id = p.id
WHERE p.status = 'generating'
  AND p.updated_at < now() - interval '30 minutes'
ORDER BY p.updated_at;

-- 2. SOFT RESET: reset attempts so pg_cron will retry automatically
UPDATE public.musicas
SET attempts = 0, last_attempt_at = NULL, status = 'generating'
WHERE presente_id = 'REPLACE_WITH_PRESENTE_ID';

-- 3. HARD RESET: mark as failed + reset (user retries from Dashboard)
UPDATE public.musicas
SET status = 'generating', attempts = 0, last_attempt_at = NULL
WHERE presente_id = 'REPLACE_WITH_PRESENTE_ID';

-- 4. FORCE COMPLETE: mark as ready if audio already exists in Storage
-- (only if you've confirmed the mp3 is in the 'musicas' bucket)
UPDATE public.musicas
SET status = 'ready', attempts = 0
WHERE presente_id = 'REPLACE_WITH_PRESENTE_ID'
  AND url_audio IS NOT NULL;

UPDATE public.presentes
SET status = 'ready', updated_at = now()
WHERE id = 'REPLACE_WITH_PRESENTE_ID'
  AND EXISTS (
    SELECT 1 FROM public.musicas
    WHERE presente_id = 'REPLACE_WITH_PRESENTE_ID' AND status = 'ready'
  );

-- 5. BATCH RESET: reset ALL stuck records (use with caution)
UPDATE public.musicas m
SET attempts = 0, last_attempt_at = NULL, status = 'generating'
FROM public.presentes p
WHERE p.id = m.presente_id
  AND p.status = 'generating'
  AND p.updated_at < now() - interval '30 minutes';

-- 6. CHECK cron is running
SELECT * FROM cron.job WHERE jobname = 'retry-music-generation';
