-- Corrige gifts que ficaram com status='ready' mas video_url=NULL
-- devido ao bug no render-complete que não processava corretamente
-- o payload do webhook do Remotion Lambda.
--
-- Estes gifts nunca tiveram o video_url preenchido porque o
-- render-complete estava quebrado (commit 3e3c20f).
-- O status 'ready' foi definido manualmente via script de recuperação
-- ou nunca deveria ter sido definido.
--
-- A correção no código (get-download-url e proxy-video) agora usa
-- presigned URLs em vez de HEAD anônimo para verificar se o vídeo
-- existe no S3, resolvendo o problema para gifts que realmente
-- foram renderizados.
--
-- Para gifts que NUNCA foram renderizados (não há arquivo no S3),
-- esta migration marca como 'failed' para que o usuário possa
-- clicar em "Tentar novamente" e re-renderizar.

-- 1. Identificar gifts inconsistentes (para auditoria)
SELECT
  id,
  nome_homenageado,
  slug,
  status,
  video_url,
  updated_at
FROM public.presentes
WHERE status = 'ready'
  AND (video_url IS NULL OR video_url = '')
ORDER BY updated_at DESC;

-- 2. Corrigir: marcar como 'failed' para forçar retry do usuário
UPDATE public.presentes
SET
  status = 'failed',
  updated_at = now()
WHERE status = 'ready'
  AND (video_url IS NULL OR video_url = '');
