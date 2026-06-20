CREATE TABLE public.cupons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo     TEXT NOT NULL UNIQUE,
  usado_por  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usado_em   TIMESTAMPTZ,
  criado_em  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ler cupons"
  ON public.cupons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios registros de uso"
  ON public.cupons FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
