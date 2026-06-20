INSERT INTO public.cupons (codigo) VALUES
  ('MAGICO10'),
  ('MOMENTO10'),
  ('GRATIS10'),
  ('FELIZ10'),
  ('AMOR10')
ON CONFLICT (codigo) DO NOTHING;
