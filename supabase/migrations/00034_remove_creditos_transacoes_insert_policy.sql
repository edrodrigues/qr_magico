-- Remove permissão de INSERT direto em creditos_transacoes
-- Todas as inserções legítimas são feitas via SECURITY DEFINER RPCs ou service_role
DROP POLICY IF EXISTS "Sistema insere transações via função" ON public.creditos_transacoes;
