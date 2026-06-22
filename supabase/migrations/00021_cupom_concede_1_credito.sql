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
  SELECT EXISTS(SELECT 1 FROM public.cupons_uso WHERE cupom_id = v_cupom.id AND usuario_id = auth.uid()) INTO v_ja_usou;

  IF v_ja_usou THEN
    RETURN jsonb_build_object('success', false, 'error', 'Você já usou este cupom');
  END IF;

  IF v_usos >= v_cupom.uso_maximo THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este cupom atingiu o limite de usos');
  END IF;

  INSERT INTO public.cupons_uso (cupom_id, usuario_id) VALUES (v_cupom.id, auth.uid());

  INSERT INTO public.creditos_transacoes (usuario_id, tipo, quantidade, descricao)
  VALUES (auth.uid(), 'bonus', 1, format('Bônus por resgate do cupom %s', v_cupom.codigo));

  INSERT INTO public.creditos_saldo (usuario_id, saldo)
  VALUES (auth.uid(), 1)
  ON CONFLICT (usuario_id)
  DO UPDATE SET saldo = public.creditos_saldo.saldo + 1, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;
