ALTER TABLE public.cupons ADD COLUMN uso_maximo INT NOT NULL DEFAULT 1;

CREATE TABLE public.cupons_uso (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cupom_id   UUID NOT NULL REFERENCES public.cupons(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usado_em   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cupom_id, usuario_id)
);

ALTER TABLE public.cupons_uso ENABLE ROW LEVEL SECURITY;

INSERT INTO public.cupons_uso (cupom_id, usuario_id, usado_em)
SELECT id, usado_por, usado_em FROM public.cupons
WHERE usado_por IS NOT NULL;

ALTER TABLE public.cupons DROP COLUMN usado_por, DROP COLUMN usado_em;

CREATE POLICY "Usuários veem seus próprios usos"
  ON public.cupons_uso FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Usuários registram seus próprios usos"
  ON public.cupons_uso FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Apenas admin pode inserir cupons"
  ON public.cupons FOR INSERT
  TO authenticated
  WITH CHECK (auth.email() = 'ed.ufpe@gmail.com');

CREATE POLICY "Todos podem SELECT cupons"
  ON public.cupons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admin pode UPDATE cupons"
  ON public.cupons FOR UPDATE
  TO authenticated
  USING (auth.email() = 'ed.ufpe@gmail.com')
  WITH CHECK (auth.email() = 'ed.ufpe@gmail.com');

CREATE POLICY "Apenas admin pode DELETE cupons"
  ON public.cupons FOR DELETE
  TO authenticated
  USING (auth.email() = 'ed.ufpe@gmail.com');

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
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.email() != 'ed.ufpe@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at
    FROM auth.users u ORDER BY u.created_at DESC;
END;
$$;

INSERT INTO public.cupons (codigo, uso_maximo) VALUES ('FREE-ED', 5)
ON CONFLICT (codigo) DO NOTHING;
