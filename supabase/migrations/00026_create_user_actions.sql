CREATE TABLE public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_actions_created_at ON public.user_actions(created_at DESC);
CREATE INDEX idx_user_actions_usuario ON public.user_actions(usuario_id, created_at DESC);

ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_list_acoes(limite INT DEFAULT 30)
RETURNS TABLE (id UUID, usuario_id UUID, email TEXT, tipo TEXT, descricao TEXT, metadata JSONB, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.email() != 'ed.ufpe@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT a.id, a.usuario_id, u.email::TEXT, a.tipo, a.descricao, a.metadata, a.created_at
  FROM public.user_actions a
  LEFT JOIN auth.users u ON u.id = a.usuario_id
  ORDER BY a.created_at DESC
  LIMIT limite;
END;
$$;

INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata, created_at)
SELECT p.usuario_id, 'criou_presente', 'Criou um presente',
  jsonb_build_object('presente_id', p.id, 'slug', p.slug), p.created_at
FROM public.presentes p;

INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata, created_at)
SELECT p.usuario_id,
  CASE p.status WHEN 'ready' THEN 'video_pronto' WHEN 'failed' THEN 'geracao_falhou' WHEN 'cancelled' THEN 'cancelou_presente' END,
  CASE p.status WHEN 'ready' THEN 'Vídeo ficou pronto' WHEN 'failed' THEN 'Geração do vídeo falhou' WHEN 'cancelled' THEN 'Cancelou um presente' END,
  jsonb_build_object('presente_id', p.id), p.updated_at
FROM public.presentes p
WHERE p.status IN ('ready', 'failed', 'cancelled') AND p.updated_at != p.created_at;

INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata, created_at)
SELECT cu.usuario_id, 'resgatou_cupom', 'Resgatou cupom de desconto',
  jsonb_build_object('cupom_id', cu.cupom_id), cu.usado_em
FROM public.cupons_uso cu;

INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata, created_at)
SELECT ct.usuario_id,
  CASE ct.tipo WHEN 'compra' THEN 'comprou_creditos' WHEN 'consumo' THEN 'consumiu_credito' WHEN 'bonus' THEN 'recebeu_bonus' END,
  ct.descricao, jsonb_build_object('transacao_id', ct.id, 'quantidade', ct.quantidade), ct.created_at
FROM public.creditos_transacoes ct;

INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata, created_at)
SELECT p.usuario_id, 'pagamento_confirmado',
  CASE WHEN p.tipo = 'creditos' THEN 'Compra de créditos confirmada' ELSE 'Pagamento confirmado' END,
  jsonb_build_object('pagamento_id', p.id, 'tipo', p.tipo, 'valor_centavos', p.valor_centavos),
  COALESCE(p.paid_at, p.created_at)
FROM public.pagamentos p
WHERE p.status = 'paid';

CREATE OR REPLACE FUNCTION public.log_presente_action()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
    VALUES (NEW.usuario_id, 'criou_presente', 'Criou um presente',
      jsonb_build_object('presente_id', NEW.id, 'slug', NEW.slug));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'generating' THEN
        INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
        VALUES (NEW.usuario_id, 'iniciou_geracao', 'Iniciou geração do vídeo',
          jsonb_build_object('presente_id', NEW.id));
      WHEN 'ready' THEN
        INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
        VALUES (NEW.usuario_id, 'video_pronto', 'Vídeo ficou pronto',
          jsonb_build_object('presente_id', NEW.id));
      WHEN 'failed' THEN
        INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
        VALUES (NEW.usuario_id, 'geracao_falhou', 'Geração do vídeo falhou',
          jsonb_build_object('presente_id', NEW.id, 'error', NEW.error_message));
      WHEN 'cancelled' THEN
        INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
        VALUES (NEW.usuario_id, 'cancelou_presente', 'Cancelou um presente',
          jsonb_build_object('presente_id', NEW.id));
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_presente_actions
  AFTER INSERT OR UPDATE ON public.presentes
  FOR EACH ROW EXECUTE FUNCTION public.log_presente_action();

CREATE OR REPLACE FUNCTION public.log_pagamento_action()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
    VALUES (NEW.usuario_id, 'criou_pagamento',
      CASE WHEN NEW.tipo = 'creditos' THEN 'Iniciou compra de créditos' ELSE 'Iniciou pagamento' END,
      jsonb_build_object('pagamento_id', NEW.id, 'tipo', NEW.tipo, 'valor_centavos', NEW.valor_centavos));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'paid' THEN
    INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
    VALUES (NEW.usuario_id, 'pagamento_confirmado',
      CASE WHEN NEW.tipo = 'creditos' THEN 'Compra de créditos confirmada' ELSE 'Pagamento confirmado' END,
      jsonb_build_object('pagamento_id', NEW.id, 'tipo', NEW.tipo, 'valor_centavos', NEW.valor_centavos));
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_pagamento_actions
  AFTER INSERT OR UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.log_pagamento_action();

CREATE OR REPLACE FUNCTION public.log_credito_action()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
  VALUES (NEW.usuario_id,
    CASE NEW.tipo WHEN 'compra' THEN 'comprou_creditos' WHEN 'consumo' THEN 'consumiu_credito' WHEN 'bonus' THEN 'recebeu_bonus' END,
    NEW.descricao, jsonb_build_object('transacao_id', NEW.id, 'quantidade', NEW.quantidade));
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_credito_actions
  AFTER INSERT ON public.creditos_transacoes
  FOR EACH ROW EXECUTE FUNCTION public.log_credito_action();

CREATE OR REPLACE FUNCTION public.log_cupom_action()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_codigo TEXT;
BEGIN
  SELECT codigo INTO v_codigo FROM public.cupons WHERE id = NEW.cupom_id;
  INSERT INTO public.user_actions (usuario_id, tipo, descricao, metadata)
  VALUES (NEW.usuario_id, 'resgatou_cupom', 'Resgatou cupom de desconto',
    jsonb_build_object('cupom_id', NEW.cupom_id, 'codigo', v_codigo));
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_cupom_actions
  AFTER INSERT ON public.cupons_uso
  FOR EACH ROW EXECUTE FUNCTION public.log_cupom_action();
