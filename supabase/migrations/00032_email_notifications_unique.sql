-- Remove duplicate welcome email for ed.ufpe@gmail.com
DELETE FROM public.email_notificacoes
WHERE id = 'e7243985-dbc8-46de-830a-92c61fbd0667';

-- Prevent duplicate welcome/inactivity_7d per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_notif_unique_no_presente
ON public.email_notificacoes(usuario_id, tipo)
WHERE presente_id IS NULL;

-- Safe insert function that ignores duplicates (welcome, inactivity_7d)
CREATE OR REPLACE FUNCTION public.insert_email_notificacao(
  p_usuario_id UUID,
  p_tipo TEXT,
  p_email TEXT,
  p_presente_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.email_notificacoes (usuario_id, tipo, email, presente_id, metadata)
  VALUES (p_usuario_id, p_tipo, p_email, p_presente_id, p_metadata)
  ON CONFLICT (usuario_id, tipo) WHERE presente_id IS NULL
  DO NOTHING;
END;
$$;
