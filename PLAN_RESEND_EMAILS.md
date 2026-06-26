# Plano de Implementação: Resend para Emails Transacionais

## Stack

| Camada | Tecnologia |
|---|---|
| Envio | Resend (API REST) |
| Templates | HTML inline (no código) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Agendamento | pg_cron (a cada 1h) |
| Rastreamento | Tabela `email_notificacoes` no PostgreSQL |

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  pg_cron (a cada 1h)                                │
│  └─ process-email-queue (Edge Function)             │
│     ├─ Verifica drafts antigos → envia lembretes    │
│     ├─ Verifica pending_payment → envia lembretes   │
│     ├─ Verifica ready → envia email de conclusão    │
│     ├─ Verifica novos users → welcome email         │
│     └─ Verifica inativos 7d → reengagement          │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  send-email (Edge Function)                         │
│  ├─ Carrega template HTML                           │
│  ├─ Interpola variáveis                             │
│  ├─ Gera PDF + QR (server-side, conclusão apenas)   │
│  └─ Envia via Resend API                            │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Resend (API de envio)                              │
│  └─ Domínio: momentomagico.xyz                      │
└─────────────────────────────────────────────────────┘
```

## Pré-requisito

- Conta em [resend.com](https://resend.com) (plano gratuito: 100 emails/dia)
- Verificar domínio `momentomagico.xyz` (DNS TXT record)
- Gerar API Key no dashboard do Resend
- Armazenar key em `app_secrets` (`RESEND_API_KEY`) + `supabase/.env` para dev

## 1. Database — Migration `00025_email_notifications.sql`

```sql
CREATE TABLE public.email_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presente_id UUID REFERENCES public.presentes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'welcome',
    'draft_reminder_1',
    'draft_reminder_2',
    'payment_reminder_1',
    'payment_reminder_2',
    'completion',
    'inactivity_7d'
  )),
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_email_notificacoes_usuario ON email_notificacoes(usuario_id);
CREATE INDEX idx_email_notificacoes_tipo ON email_notificacoes(tipo);
CREATE INDEX idx_email_notificacoes_presente ON email_notificacoes(presente_id);
```

Agendamento pg_cron (no mesmo migration):

```sql
SELECT cron.schedule(
  'process-email-queue',
  '0 * * * *',  -- a cada 1 hora
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id$$
);
```

## 2. Edge Functions

### 2.1 `send-email` (`verify_jwt = false`)

**Localização:** `supabase/functions/send-email/index.ts`

**Comportamento:**
- Recebe `{ to, tipo, data }` via POST
- Carrega template HTML do diretório `templates/`
- Interpola variáveis (`{{nome}}`, `{{link}}`, etc.)
- Caso `tipo = "completion"`:
  - Gera PDF do momento mágico com `jsPDF` (via esm.sh)
  - Gera QR code com `qrcode` (via esm.sh), converte para imagem PNG base64
  - Anexa PDF + QR ao email via `attachments` da Resend API
- Envia via `fetch` para `https://api.resend.com/emails`
- Registra envio em `email_notificacoes`

**Templates HTML:** `supabase/functions/send-email/templates/`

| Arquivo | Conteúdo |
|---|---|
| `welcome.html` | Boas-vindas ao Momento Mágico, CTA "Criar seu primeiro presente" |
| `draft-reminder.html` | "Seu rascunho está esperando!", CTA para continuar |
| `payment-reminder.html` | "Pagamento pendente", CTA para finalizar |
| `completion.html` | "Seu Momento Mágico ficou pronto!" + links visualizar/download |
| `inactivity.html` | "O que você pode criar no Momento Mágico" + exemplos |

### 2.2 `process-email-queue` (`verify_jwt = false`)

**Localização:** `supabase/functions/process-email-queue/index.ts`

**Lógica por cenário:**

| Cenário | Query | Condição |
|---|---|---|
| **welcome** | `auth.users` LEFT JOIN `email_notificacoes (tipo=welcome)` | user criado há >1h, sem welcome enviado |
| **draft_reminder_1** | `presentes` status=draft | `created_at + 24h <= now()`, sem `draft_reminder_1` |
| **draft_reminder_2** | `presentes` status=draft | `created_at + 36h <= now()`, com `draft_reminder_1`, sem `draft_reminder_2` |
| **payment_reminder_1** | `presentes` status=pending_payment | `updated_at + 24h <= now()`, sem `payment_reminder_1` |
| **payment_reminder_2** | `presentes` status=pending_payment | `updated_at + 36h <= now()`, com `payment_reminder_1`, sem `payment_reminder_2` |
| **completion** | `presentes` status=ready | `updated_at + 5min <= now()`, sem `completion` enviado |
| **inactivity_7d** | `auth.users` sem nenhum `presentes` criado | user criado há >7d, sem `inactivity_7d` enviado |

Para cada cenário encontrado, chama `send-email` via fetch interno.

## 3. Config (`supabase/config.toml`)

```toml
[functions.send-email]
verify_jwt = false

[functions.process-email-queue]
verify_jwt = false
```

## 4. Arquivos Modificados (integrações)

| Arquivo | Mudança | Quando |
|---|---|---|
| `src/contexts/AuthContext.tsx` | Após `signUp` bem-sucedido, fetch para `send-email` com `tipo=welcome` | Imediato (no frontend) |
| `supabase/functions/render-complete/index.ts` | (Opcional — o cron já cobre) Nenhuma mudança necessária por enquanto | — |

## 5. Fluxo por Cenário (visão ponta a ponta)

### 1. Signup → Welcome

```
Usuário cadastra email em /auth
  → AuthContext.signUp() → Supabase Auth
  → Frontend chama send-email (tipo=welcome)
  → Resend → Email "Bem vindo ao Momento Mágico" na caixa de entrada
```

### 2. Draft >24h → Lembrete 1

```
pg_cron (cada hora) → process-email-queue
  → SELECT presentes WHERE status='draft' AND created_at + 24h <= now()
     AND NOT EXISTS (email_notificacoes WHERE tipo='draft_reminder_1')
  → send-email (tipo=draft_reminder_1) → Resend
```

### 3. Draft >36h → Lembrete 2 (último)

```
pg_cron (cada hora) → process-email-queue
  → SELECT presentes WHERE status='draft' AND created_at + 36h <= now()
     AND EXISTS (email_notificacoes WHERE tipo='draft_reminder_1')
     AND NOT EXISTS (email_notificacoes WHERE tipo='draft_reminder_2')
  → send-email (tipo=draft_reminder_2) → Resend
```

Nenhum email adicional após este.

### 4. Pending Payment >24h → Lembrete 1

```
pg_cron (cada hora) → process-email-queue
  → SELECT presentes WHERE status='pending_payment' AND updated_at + 24h <= now()
     AND NOT EXISTS (email_notificacoes WHERE tipo='payment_reminder_1')
  → send-email (tipo=payment_reminder_1) → Resend
```

### 5. Pending Payment >36h → Lembrete 2 (último)

```
pg_cron (cada hora) → process-email-queue
  → SELECT presentes WHERE status='pending_payment' AND updated_at + 36h <= now()
     AND EXISTS (email_notificacoes WHERE tipo='payment_reminder_1')
     AND NOT EXISTS (email_notificacoes WHERE tipo='payment_reminder_2')
  → send-email (tipo=payment_reminder_2) → Resend
```

Nenhum email adicional após este.

### 6. Pagamento → Conclusão

```
Usuário paga (infinitepay-webhook) → status=generating
  → Remotion Lambda renderiza vídeo
  → render-complete webhook → status=ready

pg_cron (cada hora) → process-email-queue
  → SELECT presentes WHERE status='ready' AND updated_at + 5min <= now()
     AND NOT EXISTS (email_notificacoes WHERE tipo='completion')
  → send-email (tipo=completion)
    → Gera PDF (jsPDF) + QR code (qrcode) no servidor
    → Anexa ao email
    → Resend → Email com PDF + QR + links
```

### 7. 7 dias inativo → Re-engagement

```
pg_cron (cada hora) → process-email-queue
  → SELECT auth.users WHERE id NOT IN (SELECT DISTINCT usuario_id FROM presentes)
     AND created_at + 7d <= now()
     AND NOT EXISTS (email_notificacoes WHERE tipo='inactivity_7d')
  → send-email (tipo=inactivity_7d) → Resend
```

## 6. Ordem de Implementação

| # | Tarefa | Arquivos envolvidos |
|---|---|---|
| 1 | Conta Resend + API key | `app_secrets` table, `supabase/.env` |
| 2 | Migration `email_notificacoes` | `supabase/migrations/00025_email_notifications.sql` |
| 3 | Templates HTML (x5) | `supabase/functions/send-email/templates/*.html` |
| 4 | Edge Function `send-email` | `supabase/functions/send-email/index.ts` |
| 5 | Edge Function `process-email-queue` | `supabase/functions/process-email-queue/index.ts` |
| 6 | Atualizar `config.toml` | `supabase/config.toml` |
| 7 | Hook welcome no frontend | `src/contexts/AuthContext.tsx` |
| 8 | Deploy + testes | — |
