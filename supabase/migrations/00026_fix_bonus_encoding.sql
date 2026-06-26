-- Descrição ASCII-safe (evita corrupção de encoding ao aplicar migrations no Windows)
CREATE OR REPLACE FUNCTION public.descricao_bonus_cupom(p_codigo TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT format('B' || chr(244) || 'nus por resgate do cupom %s', p_codigo);
$$;

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
    RETURN jsonb_build_object('success', false, 'error', 'Cupom inv' || chr(225) || 'lido');
  END IF;

  SELECT COUNT(*) INTO v_usos FROM public.cupons_uso WHERE cupom_id = v_cupom.id;
  SELECT EXISTS(
    SELECT 1 FROM public.cupons_uso
    WHERE cupom_id = v_cupom.id AND usuario_id = auth.uid()
  ) INTO v_ja_usou;

  IF v_ja_usou THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voc' || chr(234) || ' j' || chr(225) || ' usou este cupom');
  END IF;

  IF v_usos >= v_cupom.uso_maximo THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este cupom atingiu o limite de usos');
  END IF;

  INSERT INTO public.cupons_uso (cupom_id, usuario_id) VALUES (v_cupom.id, auth.uid());

  PERFORM public.conceder_credito(
    auth.uid(),
    1,
    'bonus',
    public.descricao_bonus_cupom(v_cupom.codigo)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Corrige transacoes gravadas com encoding corrompido (B??nus)
UPDATE public.creditos_transacoes
SET descricao = regexp_replace(descricao, '^B\?\?nus', 'B' || chr(244) || 'nus')
WHERE descricao LIKE 'B??nus%';
