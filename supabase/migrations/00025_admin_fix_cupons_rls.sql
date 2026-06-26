CREATE OR REPLACE FUNCTION public.admin_list_cupons()
RETURNS TABLE (
  id UUID,
  codigo TEXT,
  uso_maximo INT,
  criado_em TIMESTAMPTZ,
  total_usos BIGINT,
  usuarios_uso JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.email() != 'ed.ufpe@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
  SELECT
    c.id,
    c.codigo,
    c.uso_maximo,
    c.criado_em,
    COUNT(cu.id)::BIGINT as total_usos,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'usuario_id', cu.usuario_id,
          'email', u.email,
          'usado_em', cu.usado_em
        )
        ORDER BY cu.usado_em DESC
      ) FILTER (WHERE cu.id IS NOT NULL),
      '[]'::jsonb
    ) as usuarios_uso
  FROM public.cupons c
  LEFT JOIN public.cupons_uso cu ON cu.cupom_id = c.id
  LEFT JOIN auth.users u ON u.id = cu.usuario_id
  GROUP BY c.id, c.codigo, c.uso_maximo, c.criado_em
  ORDER BY c.criado_em DESC;
END;
$$;
