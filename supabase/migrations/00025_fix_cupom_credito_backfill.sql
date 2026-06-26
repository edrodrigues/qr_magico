-- Helper centralizado para conceder créditos (evita duplicação entre RPCs)
CREATE OR REPLACE FUNCTION public.conceder_credito(
  p_usuario_id UUID,
  p_quantidade INT,
  p_tipo TEXT,
  p_descricao TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_quantidade = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.creditos_transacoes (usuario_id, tipo, quantidade, descricao)
  VALUES (p_usuario_id, p_tipo, p_quantidade, p_descricao);

  INSERT INTO public.creditos_saldo (usuario_id, saldo)
  VALUES (p_usuario_id, p_quantidade)
  ON CONFLICT (usuario_id)
  DO UPDATE SET
    saldo = public.creditos_saldo.saldo + p_quantidade,
    updated_at = now();
END;
$$;

-- Garante que resgatar_cupom concede 1 crédito por cupom
CREATE OR REPLACE FUNCTION public.resgatar_cupom(codigo_cupom TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cupom public.cupons%ROWTYPE;
  v_usos INT;
  v_ja_usou BOOLEAN;
BEGIN
  SELECT * INTO v_cupom FROM public.cupons WHERE codigo = codigo_cupom;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cupom inválido');
  END IF;

  SELECT COUNT(*) INTO v_usos FROM public.cupons_uso WHERE cupom_id = v_cupom.id;
  SELECT EXISTS(
    SELECT 1 FROM public.cupons_uso
    WHERE cupom_id = v_cupom.id AND usuario_id = auth.uid()
  ) INTO v_ja_usou;

  IF v_ja_usou THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já usou este cupom');
  END IF;

  IF v_usos >= v_cupom.uso_maximo THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este cupom atingiu o limite de usos');
  END IF;

  INSERT INTO public.cupons_uso (cupom_id, usuario_id) VALUES (v_cupom.id, auth.uid());

  PERFORM public.conceder_credito(
    auth.uid(),
    1,
    'bonus',
    format('Bônus por resgate do cupom %s', v_cupom.codigo)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Backfill: cupons resgatados antes desta migration sem crédito correspondente
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT cu.usuario_id, c.codigo
    FROM public.cupons_uso cu
    JOIN public.cupons c ON c.id = cu.cupom_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.creditos_transacoes ct
      WHERE ct.usuario_id = cu.usuario_id
        AND ct.tipo = 'bonus'
        AND ct.descricao = format('Bônus por resgate do cupom %s', c.codigo)
    )
  LOOP
    PERFORM public.conceder_credito(
      r.usuario_id,
      1,
      'bonus',
      format('Bônus por resgate do cupom %s', r.codigo)
    );
  END LOOP;
END $$;
