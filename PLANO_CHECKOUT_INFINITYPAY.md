# Plano de Implementação — Checkout InfinityPay

## Status: ✅ Completo (23/06/2026)

---

## Diagnóstico Atual

O app usa um esquema de créditos fictício — o "pagamento" em `WizardPagamento.tsx:36-138` e `Creditos.tsx:126-153` simplesmente chama RPCs do Supabase que concedem créditos sem processar pagamento real. O QR Code PIX e o formulário de cartão são **placeholders estáticos** sem integração com gateway.

## Arquitetura Proposta

A InfinityPay funciona via **redirecionamento**: o sistema cria um link de checkout via API, redireciona o usuário para a página da InfinityPay, e confirma o pagamento via **webhook** (recomendado) + **redirect_url** (fallback UX).

```
[React App] ──POST──> [Edge Function: create-infinitepay-link] ──POST──> [InfinityPay API /links]
     │                           │                                              │
     │                    retorna checkout_url                              retorna slug
     │                           │                                              │
     └──redirect──> [InfinityPay Checkout] ──pagamento──> [redirect_url + webhook]
                                                                   │
                                                            [Edge Function: webhook]
                                                                   │
                                              atualiza presente, concede créditos,
                                              dispara generate-music + render-video
```

## Etapas de Implementação

### 1. Banco de Dados — Migration `00023` ✅

Criar tabela `pagamentos` para rastrear transações:

```sql
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
```

**Arquivo:** `supabase/migrations/00023_create_pagamentos.sql` ✅

### 2. Edge Function: `create-infinitepay-link` ✅

**Arquivo:** `supabase/functions/create-infinitepay-link/index.ts`

- Recebe via POST: `{ presente_id?, tipo, quantidade_creditos?, valor_centavos, customer? }`
- Gera `order_nsu` no formato `presente_<uuid>` ou `creditos_<user_id>_<qtd>_<timestamp>`
- Monta payload com `handle: "edmilson-rodrigues-pa0"`, items, redirect_url, webhook_url
- Faz POST para `https://api.checkout.infinitepay.io/links`
- Retorna `{ checkout_url, slug, order_nsu }` para o frontend
- Insere registro em `pagamentos` com status `pending`

### 3. Edge Function: `infinitepay-webhook` ✅

**Arquivo:** `supabase/functions/infinitepay-webhook/index.ts`

- Recebe POST da InfinityPay com payload de confirmação
- Localiza `pagamentos` pelo `infinitepay_order_nsu`
- **Pagamento de presente**: atualiza `presentes.status = 'generating'`, concede **1 crédito cashback**, dispara `generate-music` + `render-video`
- **Compra de créditos**: insere transação em `creditos_transacoes`, atualiza `creditos_saldo`

### 4. Edge Function: `check-infinitepay-payment` ✅

**Arquivo:** `supabase/functions/check-infinitepay-payment/index.ts`

- POST `https://api.checkout.infinitepay.io/payment_check` com `{ handle, order_nsu, transaction_nsu, slug }`
- Retorna status do pagamento para verificação síncrona

### 5. WizardPagamento.tsx ✅

**Arquivo:** `src/pages/WizardPagamento.tsx`

- **Com créditos**: fluxo atual (deduz 1 crédito → gera presente)
- **Sem créditos**:
  - Botão "Ir para Pagamento" chama `create-infinitepay-link`
  - Redireciona para checkout InfinityPay
  - Remove QR Code PIX estático e formulário de cartão fictício

### 6. Creditos.tsx ✅

**Arquivo:** `src/pages/Creditos.tsx`

- Modal de "Finalizar Compra":
  - Chama `create-infinitepay-link` com tipo `creditos`
  - Redireciona para checkout InfinityPay
  - Remove QR Code PIX estático e cartão fictício

### 7. PaymentSuccess.tsx + CreditosSuccess.tsx ✅

**Arquivos:** `src/pages/PaymentSuccess.tsx`, `src/pages/CreditosSuccess.tsx`

- Lê query params de retorno (`receipt_url`, `order_nsu`, `slug`, `transaction_nsu`)
- Verifica status via `check-infinitepay-payment`
- Exibe estado: checking → paid/pending/failed
- Redireciona para dashboard após confirmação

### 8. App.tsx — Novas Rotas ✅

```tsx
<Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
<Route path="/creditos-success" element={<ProtectedRoute><CreditosSuccess /></ProtectedRoute>} />
```

### 9. Config Toml ✅

**Arquivo:** `supabase/config.toml`

```toml
[functions.create-infinitepay-link]
verify_jwt = true

[functions.infinitepay-webhook]
verify_jwt = false

[functions.check-infinitepay-payment]
verify_jwt = true
```

## Observações Importantes

- **Handle**: `"edmilson-rodrigues-pa0"` conforme documentado
- **Preço em centavos**: R$19,90 = 1990 centavos
- **Cashback**: cada pagamento de presente concede 1 crédito automaticamente (via webhook)
- **Webhook > Polling**: a documentação recomenda webhook sobre polling manual
- **Order NSU**: usado como identificador bidirecional entre nosso sistema e InfinityPay
- **verify_jwt**: `create-infinitepay-link` e `check-infinitepay-payment` exigem JWT; `infinitepay-webhook` é público

## Arquivos Modificados/Criados

| Status | Ação | Arquivo |
|--------|------|---------|
| ✅ | Criado | `supabase/migrations/00023_create_pagamentos.sql` |
| ✅ | Criado | `supabase/functions/create-infinitepay-link/index.ts` |
| ✅ | Criado | `supabase/functions/infinitepay-webhook/index.ts` |
| ✅ | Criado | `supabase/functions/check-infinitepay-payment/index.ts` |
| ✅ | Modificado | `src/pages/WizardPagamento.tsx` |
| ✅ | Modificado | `src/pages/Creditos.tsx` |
| ✅ | Criado | `src/pages/PaymentSuccess.tsx` |
| ✅ | Criado | `src/pages/CreditosSuccess.tsx` |
| ✅ | Modificado | `src/App.tsx` |
| ✅ | Modificado | `supabase/config.toml` |

## Próximos Passos (pós-deploy)

1. Aplicar migration `00023` no banco Supabase
2. Fazer deploy das 3 edge functions
3. Testar fluxo completo: criação de link → redirecionamento → pagamento → webhook → geração
4. Verificar cashback de 1 crédito após pagamento de presente
