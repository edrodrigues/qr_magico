CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presente_id UUID REFERENCES public.presentes(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('presente', 'creditos')),
  quantidade_creditos INT DEFAULT 0,
  valor_centavos INT NOT NULL,
  infinitepay_slug TEXT,
  infinitepay_order_nsu TEXT,
  transaction_nsu TEXT,
  capture_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios pagamentos"
  ON public.pagamentos FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Service role insere pagamentos"
  ON public.pagamentos FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role atualiza pagamentos"
  ON public.pagamentos FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pagamentos_order_nsu ON public.pagamentos(infinitepay_order_nsu);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON public.pagamentos(usuario_id, created_at DESC);
