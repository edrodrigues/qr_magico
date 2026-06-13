CREATE POLICY "Anyone can view ready presentes"
  ON public.presentes FOR SELECT
  USING (status = 'ready');
