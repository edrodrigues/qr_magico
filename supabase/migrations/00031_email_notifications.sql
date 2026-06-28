CREATE EXTENSION IF NOT EXISTS pg_net;

INSERT INTO public.app_secrets (key, value)
VALUES ('RESEND_API_KEY', '')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.email_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presente_id UUID REFERENCES public.presentes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'welcome',
    'draft_reminder_1',
    'draft_reminder_2',
    'payment_reminder_1',
    'payment_reminder_2',
    'completion',
    'inactivity_7d'
  )),
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_email_notificacoes_usuario ON email_notificacoes(usuario_id);
CREATE INDEX idx_email_notificacoes_tipo ON email_notificacoes(tipo);
CREATE INDEX idx_email_notificacoes_presente ON email_notificacoes(presente_id);

CREATE OR REPLACE FUNCTION public.get_email_candidates(p_tipo TEXT)
RETURNS TABLE(
  usuario_id UUID,
  email TEXT,
  nome TEXT,
  presente_id UUID,
  homenageado TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_tipo = 'welcome' THEN
    RETURN QUERY
    SELECT u.id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           NULL::UUID, NULL::TEXT
    FROM auth.users u
    WHERE u.created_at <= now() - interval '1 hour'
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.usuario_id = u.id AND n.tipo = 'welcome');

  ELSIF p_tipo = 'draft_reminder_1' THEN
    RETURN QUERY
    SELECT p.usuario_id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           p.id, p.nome_homenageado::TEXT
    FROM public.presentes p
    JOIN auth.users u ON u.id = p.usuario_id
    WHERE p.status = 'draft'
      AND p.created_at <= now() - interval '24 hours'
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'draft_reminder_1');

  ELSIF p_tipo = 'draft_reminder_2' THEN
    RETURN QUERY
    SELECT p.usuario_id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           p.id, p.nome_homenageado::TEXT
    FROM public.presentes p
    JOIN auth.users u ON u.id = p.usuario_id
    WHERE p.status = 'draft'
      AND p.created_at <= now() - interval '36 hours'
      AND EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'draft_reminder_1')
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'draft_reminder_2');

  ELSIF p_tipo = 'payment_reminder_1' THEN
    RETURN QUERY
    SELECT p.usuario_id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           p.id, p.nome_homenageado::TEXT
    FROM public.presentes p
    JOIN auth.users u ON u.id = p.usuario_id
    WHERE p.status = 'pending_payment'
      AND p.updated_at <= now() - interval '24 hours'
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'payment_reminder_1');

  ELSIF p_tipo = 'payment_reminder_2' THEN
    RETURN QUERY
    SELECT p.usuario_id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           p.id, p.nome_homenageado::TEXT
    FROM public.presentes p
    JOIN auth.users u ON u.id = p.usuario_id
    WHERE p.status = 'pending_payment'
      AND p.updated_at <= now() - interval '36 hours'
      AND EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'payment_reminder_1')
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'payment_reminder_2');

  ELSIF p_tipo = 'completion' THEN
    RETURN QUERY
    SELECT p.usuario_id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           p.id, p.nome_homenageado::TEXT
    FROM public.presentes p
    JOIN auth.users u ON u.id = p.usuario_id
    WHERE p.status = 'ready'
      AND p.updated_at <= now() - interval '5 minutes'
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.presente_id = p.id AND n.tipo = 'completion');

  ELSIF p_tipo = 'inactivity_7d' THEN
    RETURN QUERY
    SELECT u.id, u.email::TEXT,
           COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')::TEXT,
           NULL::UUID, NULL::TEXT
    FROM auth.users u
    WHERE u.created_at <= now() - interval '7 days'
      AND NOT EXISTS (SELECT 1 FROM public.presentes p WHERE p.usuario_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM public.email_notificacoes n WHERE n.usuario_id = u.id AND n.tipo = 'inactivity_7d');
  END IF;
END;
$$;

SELECT cron.schedule(
  'process-email-queue',
  '0 * * * *',
  $$SELECT net.http_post(
    url := 'https://phaglbxdzkadcaomtsmw.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id$$
);
