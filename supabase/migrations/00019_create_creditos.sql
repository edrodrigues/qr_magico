CREATE TABLE public.creditos_saldo (
  usuario_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saldo INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.creditos_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('compra', 'consumo', 'bonus')),
  quantidade INT NOT NULL,
  descricao TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creditos_saldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creditos_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seu próprio saldo"
  ON public.creditos_saldo FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuários veem suas próprias transações"
  ON public.creditos_transacoes FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Sistema insere transações via função"
  ON public.creditos_transacoes FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE OR REPLACE FUNCTION public.comprar_creditos(p_quantidade INT, p_valor_pago DECIMAL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_preco_unitario DECIMAL := 19.90;
  v_esperado DECIMAL;
BEGIN
  IF p_quantidade < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantidade mínima é 1');
  END IF;

  IF p_quantidade > 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantidade máxima é 50');
  END IF;

  v_esperado := v_preco_unitario * p_quantidade;
  IF p_valor_pago != v_esperado THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor incorreto');
  END IF;

  INSERT INTO public.creditos_transacoes (usuario_id, tipo, quantidade, descricao)
  VALUES (auth.uid(), 'compra', p_quantidade, format('Compra de %s créditos via %s', p_quantidade, 'PIX'));

  INSERT INTO public.creditos_saldo (usuario_id, saldo)
  VALUES (auth.uid(), p_quantidade)
  ON CONFLICT (usuario_id)
  DO UPDATE SET saldo = public.creditos_saldo.saldo + p_quantidade, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.consumir_credito()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_saldo INT;
BEGIN
  SELECT saldo INTO v_saldo FROM public.creditos_saldo WHERE usuario_id = auth.uid();

  IF v_saldo IS NULL OR v_saldo < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente');
  END IF;

  INSERT INTO public.creditos_transacoes (usuario_id, tipo, quantidade, descricao)
  VALUES (auth.uid(), 'consumo', -1, 'Consumo de 1 crédito para geração de presente');

  UPDATE public.creditos_saldo
  SET saldo = saldo - 1, updated_at = now()
  WHERE usuario_id = auth.uid();

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.obter_saldo_creditos()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_saldo INT;
BEGIN
  SELECT saldo INTO v_saldo FROM public.creditos_saldo WHERE usuario_id = auth.uid();
  RETURN COALESCE(v_saldo, 0);
END;
$$;

CREATE INDEX IF NOT EXISTS idx_creditos_transacoes_usuario ON public.creditos_transacoes(usuario_id, created_at DESC);
